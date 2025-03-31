import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// Types for grading results
export interface GradingResult {
  score: number
  confidence: number
  feedback: string
  scoringPoints: string // JSON string of scoring points
}

interface ScoringPoint {
  point: string
  status: "correct" | "partially" | "incorrect"
  comment: string
}

// 创建 GPT-4o 模型实例
export const gpt4o = openai("gpt-4o")

// 评分提示模板
const gradingPromptTemplate = (question: string, standardAnswer: string, studentAnswer: string, totalScore: number) => `
你是一个专业的教育评分助手。请根据以下信息评分：

题目: ${question}
标准答案: ${standardAnswer}
学生答案: ${studentAnswer}
总分: ${totalScore}

请分析学生答案并提供以下信息:
1. 分数（满分${totalScore}分）
2. 评分点分析（列出关键评分点及得分情况）
3. 评语和反馈
4. 置信度（0-100%，表示你对这个评分的确信程度）

以JSON格式返回，格式如下:
{
  "score": 数字,
  "scoringPoints": [
    {"point": "评分点描述", "status": "correct|partially|incorrect", "comment": "简短评论"}
  ],
  "feedback": "详细评语",
  "confidence": 数字
}
`

/**
 * Grade a student's answer using AI
 *
 * @param question The question text
 * @param standardAnswer The standard/model answer
 * @param studentAnswer The student's answer to evaluate
 * @param maxScore The maximum possible score for this question
 * @returns GradingResult with score, confidence, feedback and scoring points
 */
export async function gradeAnswer(
  question: string,
  standardAnswer: string,
  studentAnswer: string,
  maxScore: number,
): Promise<GradingResult> {
  try {
    // Create a detailed prompt for the AI
    const prompt = `
You are an expert educational grader. Your task is to grade a student's answer based on a standard answer.

Question:
${question}

Standard Answer:
${standardAnswer}

Student Answer:
${studentAnswer}

Maximum Score: ${maxScore}

Please evaluate the student's answer and provide:
1. A score between 0 and ${maxScore} (can include decimal points for partial credit)
2. Your confidence in this evaluation (0-100%)
3. Constructive feedback for the student
4. Scoring points that break down the evaluation

Return your evaluation in the following JSON format:
{
  "score": number,
  "confidence": number,
  "feedback": "string",
  "scoringPoints": [
    {
      "point": "aspect being evaluated",
      "status": "correct|partially|incorrect",
      "comment": "specific comment about this aspect"
    },
    ...
  ]
}
`

    // Use the AI SDK to generate the evaluation
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.2, // Lower temperature for more consistent results
      maxTokens: 1000,
    })

    // Parse the response
    try {
      // Extract JSON from the response (in case there's any extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("Could not extract JSON from AI response")
      }

      const jsonStr = jsonMatch[0]
      const result = JSON.parse(jsonStr)

      // Validate the result structure
      if (
        typeof result.score !== "number" ||
        typeof result.confidence !== "number" ||
        typeof result.feedback !== "string" ||
        !Array.isArray(result.scoringPoints)
      ) {
        throw new Error("AI response is missing required fields")
      }

      // Ensure score is within bounds
      const score = Math.max(0, Math.min(maxScore, result.score))

      // Ensure confidence is within bounds
      const confidence = Math.max(0, Math.min(100, result.confidence))

      return {
        score,
        confidence,
        feedback: result.feedback,
        scoringPoints: JSON.stringify(result.scoringPoints),
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError)
      console.error("Raw response:", text)

      // Fallback response if parsing fails
      return {
        score: 0,
        confidence: 30,
        feedback: "Unable to evaluate this answer. Please review manually.",
        scoringPoints: JSON.stringify([
          {
            point: "AI Evaluation Error",
            status: "incorrect",
            comment: "The AI was unable to properly evaluate this answer. Please review manually.",
          },
        ]),
      }
    }
  } catch (error) {
    console.error("Error grading answer:", error)
    throw error
  }
}

// 生成个性化反馈
export async function generateFeedback(
  studentName: string,
  subject: string,
  strengths: string[],
  weaknesses: string[],
) {
  const prompt = `
为学生 ${studentName} 生成一份关于 ${subject} 科目的个性化学习反馈。

优势:
${strengths.map((s) => `- ${s}`).join("\n")}

需要改进:
${weaknesses.map((w) => `- ${w}`).join("\n")}

请提供鼓励性的反馈和具体的改进建议。
`

  const { text } = await generateText({
    model: gpt4o,
    prompt,
    temperature: 0.7,
  })

  return text
}

/**
 * Batch grade multiple answers for an exam
 *
 * @param examId The ID of the exam to grade
 * @param questions Array of questions with their standard answers
 * @param answers Array of student answers
 * @returns Array of grading results
 */
export async function batchGradeAnswers(
  examId: string,
  questions: Array<{ id: string; content: string; standard_answer: string; score: number }>,
  answers: Array<{ question_id: string; student_id: string; content: string }>,
): Promise<Array<{ questionId: string; studentId: string; result: GradingResult }>> {
  const results = []

  // Process answers in batches to avoid rate limiting
  const batchSize = 5
  for (let i = 0; i < answers.length; i += batchSize) {
    const batch = answers.slice(i, i + batchSize)

    // Process each answer in the batch concurrently
    const batchResults = await Promise.all(
      batch.map(async (answer) => {
        const question = questions.find((q) => q.id === answer.question_id)
        if (!question) {
          throw new Error(`Question not found for ID: ${answer.question_id}`)
        }

        try {
          const result = await gradeAnswer(question.content, question.standard_answer, answer.content, question.score)

          return {
            questionId: answer.question_id,
            studentId: answer.student_id,
            result,
          }
        } catch (error) {
          console.error(`Error grading answer for student ${answer.student_id}, question ${answer.question_id}:`, error)

          // Return a fallback result
          return {
            questionId: answer.question_id,
            studentId: answer.student_id,
            result: {
              score: 0,
              confidence: 0,
              feedback: "Error occurred during grading. Please review manually.",
              scoringPoints: JSON.stringify([
                {
                  point: "Error",
                  status: "incorrect",
                  comment: "An error occurred during the grading process.",
                },
              ]),
            },
          }
        }
      }),
    )

    results.push(...batchResults)

    // Add a small delay between batches to avoid rate limiting
    if (i + batchSize < answers.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  return results
}

/**
 * Analyze the quality of an exam question based on student responses
 *
 * @param question The question text
 * @param standardAnswer The standard/model answer
 * @param studentAnswers Array of student answers
 * @param scores Array of scores corresponding to the student answers
 * @returns Analysis of the question quality
 */
export async function analyzeQuestionQuality(
  question: string,
  standardAnswer: string,
  studentAnswers: string[],
  scores: number[],
): Promise<{
  difficulty: number
  discrimination: number
  clarity: number
  suggestions: string
}> {
  try {
    // Create a prompt for question analysis
    const prompt = `
You are an expert in educational assessment. Analyze the following exam question and student responses:

Question:
${question}

Standard Answer:
${standardAnswer}

Student Answers and Scores:
${studentAnswers.map((answer, i) => `Student ${i + 1} (Score: ${scores[i]}): ${answer}`).join("\n\n")}

Please analyze the question quality and provide:
1. Difficulty (0-100): How challenging is this question for students?
2. Discrimination (0-100): How well does this question differentiate between high and low performing students?
3. Clarity (0-100): How clear and unambiguous is the question?
4. Suggestions: Provide specific suggestions to improve this question.

Return your analysis in the following JSON format:
{
  "difficulty": number,
  "discrimination": number,
  "clarity": number,
  "suggestions": "string with suggestions"
}
`

    // Use the AI SDK to generate the analysis
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.3,
      maxTokens: 1000,
    })

    // Parse the response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("Could not extract JSON from AI response")
      }

      const jsonStr = jsonMatch[0]
      const result = JSON.parse(jsonStr)

      return {
        difficulty: Math.max(0, Math.min(100, result.difficulty)),
        discrimination: Math.max(0, Math.min(100, result.discrimination)),
        clarity: Math.max(0, Math.min(100, result.clarity)),
        suggestions: result.suggestions,
      }
    } catch (parseError) {
      console.error("Error parsing AI response for question analysis:", parseError)

      // Fallback response
      return {
        difficulty: 50,
        discrimination: 50,
        clarity: 50,
        suggestions: "Unable to analyze this question. Please review manually.",
      }
    }
  } catch (error) {
    console.error("Error analyzing question quality:", error)
    throw error
  }
}

