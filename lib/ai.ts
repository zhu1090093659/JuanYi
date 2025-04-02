import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import OpenAI from 'openai'

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

/**
 * 初始化OpenAI客户端
 * 使用提供的API密钥和API基础URL
 */
export function getOpenAIClient(apiKey: string) {
  // 如果没有API密钥，抛出错误
  if (!apiKey) {
    throw new Error("未设置OpenAI API密钥。请在设置页面配置您的API密钥。");
  }

  // 创建OpenAI客户端实例，设置更长的超时时间
  return new OpenAI({
    apiKey,
    baseURL: 'https://chatwithai.icu/v1',
    timeout: 360000, // 360秒超时
    maxRetries: 3, // 最多重试3次
  });
}

/**
 * 使用AI修复JSON格式
 * @param brokenJson 格式错误的JSON字符串
 * @param errorMessage 解析错误信息
 * @param apiKey OpenAI API密钥
 * @param model OpenAI模型名称
 * @returns 修复后的JSON字符串
 */
export async function fixJsonWithAI(
  brokenJson: string, 
  errorMessage: string, 
  apiKey: string,
  model: string = "gpt-4o"
): Promise<string> {
  try {
    const openai = getOpenAIClient(apiKey);
    
    // 预处理JSON，截断过长内容
    let processedJson = brokenJson;
    if (brokenJson.length > 100000) {
      // 如果内容过长，裁剪一部分
      processedJson = brokenJson.substring(0, 50000) + "\n...[内容过长已截断]...";
    }
    
    // 构建提示词
    const prompt = `
我需要你帮助修复一个格式错误的JSON字符串。这个字符串应该包含试卷评分结果，但解析失败了。

解析错误信息: ${errorMessage}

需要修复的JSON:
${processedJson}

你的任务是返回一个有效的、格式正确的JSON对象，使其符合评分结果的格式要求。

仅返回修复后的JSON，不要添加任何解释、注释或代码块标记。确保所有属性名和字符串值都使用双引号，JSON格式完全符合标准。
`;

    // 调用OpenAI API
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "你是一个专业的JSON修复专家，擅长修复格式错误的JSON。" },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 128000,
    });

    // 提取回答内容
    const responseText = completion.choices[0]?.message?.content || '';
    
    // 尝试提取有效的JSON
    if (responseText.trim().startsWith('{') && responseText.trim().endsWith('}')) {
      // 验证是否为有效JSON
      JSON.parse(responseText); // 如果无效会抛出异常
      return responseText;
    }
    
    // 尝试提取花括号包围的部分
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonText = jsonMatch[0];
      // 验证提取的部分是否为有效JSON
      JSON.parse(jsonText); // 如果无效会抛出异常
      return jsonText;
    }
    
    // 如果以上方法都失败，抛出错误
    throw new Error("无法提取有效的JSON对象");
  } catch (error: any) {
    console.error("JSON修复失败:", error);
    throw new Error(`无法修复JSON格式: ${error.message}`);
  }
}

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
 * @param model OpenAI模型名称，默认为gpt-4o
 * @param apiKey OpenAI API密钥，如果提供则使用自定义客户端
 * @returns GradingResult with score, confidence, feedback and scoring points
 */
export async function gradeAnswer(
  question: string,
  standardAnswer: string,
  studentAnswer: string,
  maxScore: number,
  model: string = "gpt-4o",
  apiKey?: string,
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

    let text: string;
    
    // 根据是否提供了API密钥决定使用哪种方式调用API
    if (apiKey) {
      // 使用自定义OpenAI客户端
      const openaiClient = getOpenAIClient(apiKey);
      const completion = await openaiClient.chat.completions.create({
        model,
        messages: [
          { role: "system", content: "你是一个专业的教育评分助手，可以精确评估学生答案。" },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 128000,
      });
      text = completion.choices[0]?.message?.content || '';
    } else {
      // 使用AI SDK
      const { text: resultText } = await generateText({
        model: openai(model),
        prompt,
        temperature: 0.3,
        maxTokens: 128000,
      });
      text = resultText;
    }

    // Parse the response
    try {
      // Extract JSON from the response (in case there's any extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("Could not extract JSON from AI response")
      }

      const jsonStr = jsonMatch[0]
      let result;
      
      try {
        result = JSON.parse(jsonStr);
      } catch (parseError: any) {
        console.error("第一次解析AI返回的JSON失败，尝试使用AI修复:", parseError);
        
        // 如果有提供API密钥，使用AI修复JSON
        if (apiKey) {
          const fixedJson = await fixJsonWithAI(jsonStr, parseError.message, apiKey, model);
          result = JSON.parse(fixedJson);
          console.log("使用AI修复后的JSON解析成功");
        } else {
          throw parseError; // 如果没有API密钥，则直接抛出解析错误
        }
      }

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
        feedback: "无法评估此答案。请手动审核。",
        scoringPoints: JSON.stringify([
          {
            point: "AI评估错误",
            status: "incorrect",
            comment: "AI无法正确评估此答案。请手动审核。",
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
  model: string = "gpt-4o",
  apiKey?: string,
) {
  const prompt = `
为学生 ${studentName} 生成一份关于 ${subject} 科目的个性化学习反馈。

优势:
${strengths.map((s) => `- ${s}`).join("\n")}

需要改进:
${weaknesses.map((w) => `- ${w}`).join("\n")}

请提供鼓励性的反馈和具体的改进建议。
`

  if (apiKey) {
    // 使用自定义OpenAI客户端
    const openaiClient = getOpenAIClient(apiKey);
    const completion = await openaiClient.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "你是一个专业的教育反馈助手，擅长提供有建设性的学习建议。" },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 128000,
    });
    return completion.choices[0]?.message?.content || '';
  } else {
    // 使用AI SDK
    const { text } = await generateText({
      model: openai(model),
      prompt,
      temperature: 0.3,
      maxTokens: 128000,
    });
    return text;
  }
}

/**
 * 一次性评分整个试卷的所有问题
 *
 * @param examId 考试ID
 * @param questions 考试中的所有问题及其标准答案
 * @param studentId 学生ID
 * @param studentAnswers 学生对应每个问题的答案
 * @param model OpenAI模型名称，默认为gpt-4o
 * @param apiKey OpenAI API密钥，如果提供则使用自定义客户端
 * @returns 包含所有题目评分结果的数组
 */
export async function gradeExam(
  examId: string,
  questions: Array<{ id: string; content: string; standard_answer: string; score: number }>,
  studentId: string,
  studentAnswers: Array<{ question_id: string; content: string }>,
  model: string = "gpt-4o",
  apiKey?: string,
): Promise<Array<{ questionId: string; result: GradingResult }>> {
  try {
    // 构建一个详细的提示，包含整个试卷的所有问题和答案
    const questionsWithAnswers = questions.map(question => {
      const studentAnswer = studentAnswers.find(a => a.question_id === question.id);
      return {
        id: question.id,
        question: question.content,
        standardAnswer: question.standard_answer,
        studentAnswer: studentAnswer ? studentAnswer.content : "",
        maxScore: question.score
      };
    });

    const prompt = `
你是一位专业的教育评分助手。请为以下试卷的所有问题进行评分。

试卷ID: ${examId}
学生ID: ${studentId}

${questionsWithAnswers.map((q, index) => `
问题 ${index + 1} (ID: ${q.id})：
${q.question}

标准答案：
${q.standardAnswer}

学生答案：
${q.studentAnswer}

满分：${q.maxScore}
`).join('\n\n')}

请为每个问题提供以下评分信息：
1. 分数（不超过该题的满分）
2. 评分点分析（列出关键评分点及得分情况）
3. 评语和反馈
4. 置信度（0-100%，表示你对这个评分的确信程度）

以JSON格式返回，格式如下:
{
  "results": [
    {
      "questionId": "问题ID",
      "score": 分数,
      "confidence": 置信度,
      "feedback": "详细评语",
      "scoringPoints": [
        {"point": "评分点描述", "status": "correct|partially|incorrect", "comment": "简短评论"}
      ]
    },
    // 其他问题的评分...
  ]
}
`

    let text: string;
    
    // 根据是否提供了API密钥决定使用哪种方式调用API
    if (apiKey) {
      // 使用自定义OpenAI客户端
      const openaiClient = getOpenAIClient(apiKey);
      const completion = await openaiClient.chat.completions.create({
        model,
        messages: [
          { role: "system", content: "你是一个专业的教育评分助手，可以精确评估学生答案。" },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 128000,
      });
      text = completion.choices[0]?.message?.content || '';
    } else {
      // 使用AI SDK
      const { text: resultText } = await generateText({
        model: openai(model),
        prompt,
        temperature: 0.3,
        maxTokens: 128000,
      });
      text = resultText;
    }

    // 解析响应
    try {
      // 从响应中提取JSON（以防有额外文本）
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("无法从AI响应中提取JSON")
      }

      const jsonStr = jsonMatch[0]
      let result;
      
      try {
        result = JSON.parse(jsonStr);
      } catch (parseError: any) {
        console.error("第一次解析AI返回的JSON失败，尝试使用AI修复:", parseError);
        
        // 如果有提供API密钥，使用AI修复JSON
        if (apiKey) {
          const fixedJson = await fixJsonWithAI(jsonStr, parseError.message, apiKey, model);
          result = JSON.parse(fixedJson);
          console.log("使用AI修复后的JSON解析成功");
        } else {
          throw parseError; // 如果没有API密钥，则直接抛出解析错误
        }
      }

      // 验证结果结构
      if (!result.results || !Array.isArray(result.results)) {
        throw new Error("AI响应缺少必要的字段")
      }

      // 处理每个问题的评分结果
      return result.results.map((questionResult: any) => {
        // 确保分数在范围内
        const question = questions.find(q => q.id === questionResult.questionId);
        const maxScore = question ? question.score : 100;
        const score = Math.max(0, Math.min(maxScore, questionResult.score));
        
        // 确保置信度在范围内
        const confidence = Math.max(0, Math.min(100, questionResult.confidence));

        return {
          questionId: questionResult.questionId,
          result: {
            score,
            confidence,
            feedback: questionResult.feedback,
            scoringPoints: JSON.stringify(questionResult.scoringPoints),
          }
        };
      });

    } catch (parseError) {
      console.error("解析AI响应时出错:", parseError)
      console.error("原始响应:", text)

      // 解析失败时的回退响应
      return questions.map(q => ({
        questionId: q.id,
        result: {
          score: 0,
          confidence: 30,
          feedback: "无法评估此答案。请手动审核。",
          scoringPoints: JSON.stringify([
            {
              point: "AI评估错误",
              status: "incorrect",
              comment: "AI无法正确评估此答案。请手动审核。",
            },
          ]),
        }
      }));
    }
  } catch (error) {
    console.error("评分试卷时出错:", error)
    throw error
  }
}

/**
 * 批量评分整个考试的所有学生的试卷
 *
 * @param examId 考试ID
 * @param questions 考试中的所有问题及其标准答案
 * @param studentAnswers 所有学生的答案，按学生ID分组
 * @param model OpenAI模型名称，默认为gpt-4o
 * @param apiKey OpenAI API密钥，如果提供则使用自定义客户端
 * @returns 评分结果数组
 */
export async function batchGradeExams(
  examId: string,
  questions: Array<{ id: string; content: string; standard_answer: string; score: number }>,
  studentAnswers: Array<{ question_id: string; student_id: string; content: string }>,
  model: string = "gpt-4o",
  apiKey?: string,
): Promise<Array<{ studentId: string; questionId: string; result: GradingResult }>> {
  // 按学生ID将答案分组
  const answersByStudent: Record<string, Array<{ question_id: string; content: string }>> = {};
  
  studentAnswers.forEach(answer => {
    if (!answersByStudent[answer.student_id]) {
      answersByStudent[answer.student_id] = [];
    }
    answersByStudent[answer.student_id].push({
      question_id: answer.question_id,
      content: answer.content
    });
  });

  const results = [];

  // 处理每个学生的试卷
  const studentIds = Object.keys(answersByStudent);
  const batchSize = 3; // 每批处理的学生数量
  
  for (let i = 0; i < studentIds.length; i += batchSize) {
    const batchStudentIds = studentIds.slice(i, i + batchSize);
    
    // 并行处理每个学生的试卷
    const batchResults = await Promise.all(
      batchStudentIds.map(async (studentId) => {
        try {
          const studentResults = await gradeExam(
            examId,
            questions,
            studentId,
            answersByStudent[studentId],
            model,
            apiKey
          );
          
          // 将学生ID添加到每个结果中
          return studentResults.map(result => ({
            studentId,
            questionId: result.questionId,
            result: result.result
          }));
        } catch (error) {
          console.error(`评分学生 ${studentId} 的试卷时出错:`, error);
          
          // 返回回退结果
          return questions.map(question => ({
            studentId,
            questionId: question.id,
            result: {
              score: 0,
              confidence: 0,
              feedback: "评分过程中发生错误。请手动审核。",
              scoringPoints: JSON.stringify([
                {
                  point: "错误",
                  status: "incorrect",
                  comment: "评分过程中发生错误。",
                },
              ]),
            }
          }));
        }
      })
    );
    
    // 展平结果并添加到总结果中
    results.push(...batchResults.flat());
    
    // 在批次之间添加小延迟，以避免速率限制
    if (i + batchSize < studentIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return results;
}

/**
 * Analyze the quality of an exam question based on student responses
 *
 * @param question The question text
 * @param standardAnswer The standard/model answer
 * @param studentAnswers Array of student answers
 * @param scores Array of scores corresponding to the student answers
 * @param model OpenAI模型名称，默认为gpt-4o
 * @param apiKey OpenAI API密钥，如果提供则使用自定义客户端
 * @returns Analysis of the question quality
 */
export async function analyzeQuestionQuality(
  question: string,
  standardAnswer: string,
  studentAnswers: string[],
  scores: number[],
  model: string = "gpt-4o",
  apiKey?: string,
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

    let text: string;
    
    // 根据是否提供了API密钥决定使用哪种方式调用API
    if (apiKey) {
      // 使用自定义OpenAI客户端
      const openaiClient = getOpenAIClient(apiKey);
      const completion = await openaiClient.chat.completions.create({
        model,
        messages: [
          { role: "system", content: "你是一个专业的教育评估专家，擅长分析考试题目的质量。" },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 128000,
      });
      text = completion.choices[0]?.message?.content || '';
    } else {
      // 使用AI SDK
      const { text: resultText } = await generateText({
        model: openai(model),
        prompt,
        temperature: 0.3,
        maxTokens: 128000,
      });
      text = resultText;
    }

    // Parse the response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("Could not extract JSON from AI response")
      }

      const jsonStr = jsonMatch[0]
      let result;
      
      try {
        result = JSON.parse(jsonStr);
      } catch (parseError: any) {
        console.error("第一次解析AI返回的JSON失败，尝试使用AI修复:", parseError);
        
        // 如果有提供API密钥，使用AI修复JSON
        if (apiKey) {
          const fixedJson = await fixJsonWithAI(jsonStr, parseError.message, apiKey, model);
          result = JSON.parse(fixedJson);
          console.log("使用AI修复后的JSON解析成功");
        } else {
          throw parseError; // 如果没有API密钥，则直接抛出解析错误
        }
      }

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
        suggestions: "无法分析此问题。请手动审核。",
      }
    }
  } catch (error) {
    console.error("Error analyzing question quality:", error)
    throw error
  }
}

