import OpenAI from 'openai';
import mammoth from 'mammoth';

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
 * 试卷题目的数据结构
 */
export interface ExamQuestion {
  id: string;
  type: 'choice' | 'multiChoice' | 'fill' | 'shortAnswer' | 'essay';
  content: string;
  options?: string[];
  answer: string;
  score: number;
}

/**
 * 解析试卷的结果数据结构
 */
export interface ParsedExam {
  questions: ExamQuestion[];
  totalScore: number;
  success: boolean;
  error?: string;
}

/**
 * 多模态解析试卷的结果数据结构
 */
export interface MultimodalParsedExam {
  questions: ExamQuestion[];
  totalScore: number;
  success: boolean;
  error?: string;
}

/**
 * 使用AI解析试卷文件的内容
 * @param fileContent 试卷文件的文本内容
 * @param apiKey OpenAI API密钥
 * @param model OpenAI模型名称
 * @returns 解析后的试卷数据
 */
export async function parseExamWithAI(
  fileContent: string,
  apiKey: string,
  model: string = "gpt-4o"
): Promise<ParsedExam> {
  try {
    const openai = getOpenAIClient(apiKey);

    // 检查内容长度，如果过长则进行分片处理
    const MAX_CONTENT_LENGTH = 128000; // 最大内容长度
    let processedContent = fileContent;

    if (fileContent.length > MAX_CONTENT_LENGTH) {
      console.log(`文件内容过长(${fileContent.length}字符)，将进行压缩处理`);
      // 简单压缩：移除多余空行和空格
      processedContent = fileContent
        .replace(/\n{3,}/g, '\n\n') // 替换连续3个以上的换行为2个
        .replace(/[ \t]+/g, ' ')   // 替换连续空格为单个空格
        .trim();

      // 如果还是太长，截取前N个字符
      if (processedContent.length > MAX_CONTENT_LENGTH) {
        console.log(`压缩后仍然过长(${processedContent.length}字符)，将进行截断`);
        processedContent = processedContent.substring(0, MAX_CONTENT_LENGTH) +
          "\n\n[注意：由于内容过长，此处已截断。请只处理以上内容。]";
      }
    }

    // 构建提示词，引导AI解析试卷
    const prompt = `
你是一个专业的试卷解析助手。请分析以下试卷内容，并提取所有题目、答案和分值信息。
将结果格式化为JSON数组，每个题目包含以下字段：
- id: 题号（字符串）
- type: 题型（'choice'=单选题, 'multiChoice'=多选题, 'fill'=填空题, 'shortAnswer'=简答题, 'essay'=作文/论述题）
- content: 题目内容
- options: 选项数组（仅适用于选择题）
- answer: 标准答案
- score: 分值（数字）

试卷内容：
${processedContent}

注意：
1. 请只处理试卷内容，不要包含其他文本。
2. 对于选择题，提取选项内容时，请不要包含选项序号（如A、B、C、D等）。例如，若原始选项为"A. 这是一个选项"，则只提取"这是一个选项"作为选项内容。
3. 答案中如需提及选项，可使用选项序号，如"A"、"B"、"C"、"D"等。
4. 必须返回严格有效的JSON格式，确保所有属性名都用双引号包围，字符串值也用双引号包围。
5. 不要在JSON外添加任何文本或说明，只返回JSON数组。

你必须返回严格有效的JSON数组，格式如下：
[
  {
    "id": "1",
    "type": "choice",
    "content": "题目内容",
    "options": ["选项1", "选项2", "选项3", "选项4"],
    "answer": "A",
    "score": 3
  },
  {
    "id": "2",
    "type": "shortAnswer",
    "content": "题目内容",
    "answer": "标准答案",
    "score": 5
  }
]

不要添加markdown代码块标记，直接返回上述JSON格式。
`;

    // 使用带重试的请求函数
    const retryAPICall = async (retries = 3, delay = 2000) => {
      for (let i = 0; i < retries; i++) {
        try {
          console.log(`尝试解析试卷 (尝试 ${i+1}/${retries})...`);

          // 调用OpenAI API
          const completion = await openai.chat.completions.create({
            model,
            messages: [
              { role: "system", content: "你是一个专业的试卷解析助手，擅长将试卷内容转换为结构化数据。" },
              { role: "user", content: prompt }
            ],
            temperature: 0.2, // 使用较低的温度以获得更确定性的输出
          });

          // 提取回答内容
          const responseText = completion.choices[0]?.message?.content || '';
          console.log("API返回成功，开始处理结果...");

          // 尝试解析JSON
          let questions: ExamQuestion[] = [];
          let totalScore = 0;

          try {
            // 增强JSON提取逻辑，使其更健壮
            // 输出原始响应的一部分用于调试
            console.log("AI返回内容前200字符:", responseText.substring(0, 200));
            
            // 尝试多种方式提取JSON
            let jsonText = '';
            
            // 方法1: 尝试提取标准markdown代码块
            const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (codeBlockMatch) {
              jsonText = codeBlockMatch[1].trim();
              console.log("从代码块中提取到JSON");
            } 
            // 方法2: 尝试提取方括号包围的JSON数组
            else {
              const arrayMatch = responseText.match(/\[\s*{[\s\S]*}\s*\]/);
              if (arrayMatch) {
                jsonText = arrayMatch[0].trim();
                console.log("从文本中直接提取到JSON数组");
              } 
              // 方法3: 如果以上都失败，尝试使用整个响应
              else {
                jsonText = responseText.trim();
                console.log("使用整个响应作为JSON");
              }
            }
            
            // 清理JSON文本，移除可能导致解析错误的内容
            jsonText = jsonText.replace(/^```json\s*/g, '').replace(/```$/g, '');
            
            // 检查JSON格式是否有效，必须以"["开头，"]"结尾
            if (!jsonText.trim().startsWith('[') || !jsonText.trim().endsWith(']')) {
              console.log("JSON格式不符合数组要求，尝试查找数组部分");
              // 尝试找到第一个"["和最后一个"]"之间的内容
              const startIndex = jsonText.indexOf('[');
              const endIndex = jsonText.lastIndexOf(']');
              
              if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
                jsonText = jsonText.substring(startIndex, endIndex + 1);
                console.log("提取到JSON数组部分");
              } else {
                throw new Error("找不到有效的JSON数组格式");
              }
            }
            
            try {
              // 尝试解析JSON
              questions = JSON.parse(jsonText);
              console.log("JSON解析成功");
            } catch (parseError: any) {
              console.error("标准JSON解析失败，尝试使用AI修复:", parseError);
              
              try {
                // 调用JSON修复API
                console.log("调用JSON修复服务...");
                const response = await fetch('/api/json-fixer', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ 
                    brokenJson: jsonText,
                    errorMessage: parseError.message,
                    apiKey,
                    model
                  }),
                });
                
                const result = await response.json();
                
                if (!response.ok || !result.success) {
                  throw new Error(result.error || '修复JSON失败');
                }
                
                // 解析修复后的JSON
                questions = JSON.parse(result.fixedJson);
                console.log("使用AI修复的JSON解析成功");
              } catch (fixError: any) {
                console.error("AI修复JSON失败:", fixError);
                // 如果修复也失败了，尝试基本的修复方法
                console.log("尝试基本修复方法...");
                
                // 1. 清理可能的Unicode字符或不可见字符
                let fixedJson = jsonText.replace(/[\u0000-\u0019]+/g, " ");
                // 2. 修复常见的逗号问题
                fixedJson = fixedJson.replace(/,\s*}/g, "}").replace(/,\s*\]/g, "]");
                // 3. 确保属性名使用双引号
                fixedJson = fixedJson.replace(/(\w+):/g, "\"$1\":");
                
                // 尝试解析修复后的JSON
                questions = JSON.parse(fixedJson);
                console.log("基本修复后的JSON解析成功");
              }
            }
            
            // 对选项内容进行预处理，确保不包含选项序号
            questions = questions.map(q => {
              // 对选择题进行处理
              if ((q.type === 'choice' || q.type === 'multiChoice') && Array.isArray(q.options)) {
                // 移除选项内容中可能存在的选项序号
                q.options = q.options.map(opt => 
                  typeof opt === 'string' ? opt.replace(/^[A-Z]\.?\s+/i, '') : opt
                );
              }
              return q;
            });
            
            // 计算总分
            totalScore = questions.reduce((sum, q) => sum + (q.score || 0), 0);
            console.log(`成功解析出 ${questions.length} 道题目，总分: ${totalScore}`);
          } catch (jsonError) {
            console.error("AI返回的JSON解析失败:", jsonError);
            console.error("原始响应内容:", responseText);
            throw new Error("解析AI返回的JSON失败，请尝试重新上传或手动创建题目。");
          }
          
          return {
            questions,
            totalScore,
            success: true
          };
        } catch (error: any) {
          console.error(`API调用失败 (尝试 ${i+1}/${retries}):`, error);
          
          // 检查是否是网络超时错误
          const isTimeoutError = error.code === 'ECONNABORTED' || 
                                error.code === 'ETIMEDOUT' ||
                                error.status === 504 ||
                                error.message.includes('timeout');
          
          // 如果是超时错误且内容长度大于8000，尝试进一步缩短内容
          if (isTimeoutError && i === 0 && processedContent.length > 8000) {
            console.log("检测到超时错误，尝试进一步缩短内容...");
            // 将内容缩短到原来的一半
            const newLength = Math.floor(processedContent.length / 2);
            processedContent = processedContent.substring(0, newLength) + 
              "\n\n[注意：由于内容过长导致API超时，此处已大幅截断。请只处理以上内容。]";
            
            // 更新提示词
            prompt.replace(processedContent, processedContent);
          }
          
          // 如果这是最后一次尝试，抛出错误
          if (i === retries - 1) {
            throw error;
          }
          
          // 添加指数退避延迟
          const retryDelay = delay * Math.pow(2, i);
          console.log(`将在 ${retryDelay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
      
      // 如果所有重试都失败，返回错误结果
      throw new Error("多次尝试调用API失败");
    };

    // 执行带重试的API调用
    return await retryAPICall();
    
  } catch (error: any) {
    console.error("试卷解析错误:", error);
    
    // 返回错误信息
    return {
      questions: [],
      totalScore: 0,
      success: false,
      error: error.message || "解析试卷时发生未知错误"
    };
  }
}

/**
 * 使用多模态API解析试卷图片
 * @param images 试卷图片的base64编码数组
 * @param apiKey OpenAI API密钥
 * @param model OpenAI模型名称
 * @returns 解析后的试卷数据
 */
export async function parseExamWithMultimodalAI(
  images: string[],
  apiKey: string,
  model: string = "gpt-4o"
): Promise<MultimodalParsedExam> {
  try {
    const openai = getOpenAIClient(apiKey);

    // 构建提示词，引导AI解析试卷图片
    const prompt = `
你是一个专业的试卷解析助手。请分析以下试卷图片，并提取所有题目、答案和分值信息。
将结果格式化为JSON数组，每个题目包含以下字段：
- id: 题号（字符串）
- type: 题型（'choice'=单选题, 'multiChoice'=多选题, 'fill'=填空题, 'shortAnswer'=简答题, 'essay'=作文/论述题）
- content: 题目内容
- options: 选项数组（仅适用于选择题）
- answer: 标准答案
- score: 分值（数字）

注意：
1. 图片中可能包含试卷的多个部分或正反面。
2. 请找出所有题目及其标准答案。
3. 如果某道题目的答案在另一张图片中，请尝试匹配。
4. 试卷中可能会有标准答案部分，请提取出来。
5. 对于选择题，提取选项内容时，请不要包含选项序号（如A、B、C、D等）。例如，若原始选项为"A. 这是一个选项"，则只提取"这是一个选项"作为选项内容。
6. 答案中如需提及选项，可使用选项序号，如"A"、"B"、"C"、"D"等。
7. 必须返回严格有效的JSON格式，确保所有属性名都用双引号包围，字符串值也用双引号包围。
8. 不要在JSON外添加任何文本或说明，只返回JSON数组。

你必须返回严格有效的JSON数组，格式如下：
[
  {
    "id": "1",
    "type": "choice",
    "content": "题目内容",
    "options": ["选项1", "选项2", "选项3", "选项4"],
    "answer": "A",
    "score": 3
  },
  {
    "id": "2",
    "type": "shortAnswer",
    "content": "题目内容",
    "answer": "标准答案",
    "score": 5
  }
]

不要添加markdown代码块标记，直接返回上述JSON格式。
`;

    // 使用带重试的请求函数
    const retryAPICall = async (retries = 3, delay = 2000) => {
      for (let i = 0; i < retries; i++) {
        try {
          console.log(`尝试解析试卷图片 (尝试 ${i+1}/${retries})...`);

          // 构建多模态消息
          // OpenAI SDK 4.90.0的类型定义要求显式地指定字面量类型
          type ContentPart = 
            | { type: "text"; text: string }
            | { type: "image_url"; image_url: { url: string } };

          const userContent: ContentPart[] = [
            { type: "text" as const, text: prompt }
          ];
          
          // 添加所有图片
          for (const imageBase64 of images) {
            userContent.push({
              type: "image_url" as const, 
              image_url: { url: imageBase64 }
            });
          }

          // 调用OpenAI API
          const completion = await openai.chat.completions.create({
            model,
            messages: [
              {
                role: "system" as const,
                content: "你是一个专业的试卷解析助手，擅长将试卷内容转换为结构化数据。你能够分析试卷图片，并提取题目、选项、答案和分值。"
              },
              {
                role: "user" as const,
                content: userContent
              }
            ],
            temperature: 0.2,
            max_tokens: 4000,
          });

          // 提取回答内容
          const responseText = completion.choices[0]?.message?.content || '';
          console.log("API返回成功，开始处理结果...");

          // 尝试解析JSON
          let questions: ExamQuestion[] = [];
          let totalScore = 0;

          try {
            // 增强JSON提取逻辑，使其更健壮
            // 输出原始响应的一部分用于调试
            console.log("AI返回内容前200字符:", responseText.substring(0, 200));
            
            // 尝试多种方式提取JSON
            let jsonText = '';
            
            // 方法1: 尝试提取标准markdown代码块
            const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (codeBlockMatch) {
              jsonText = codeBlockMatch[1].trim();
              console.log("从代码块中提取到JSON");
            } 
            // 方法2: 尝试提取方括号包围的JSON数组
            else {
              const arrayMatch = responseText.match(/\[\s*{[\s\S]*}\s*\]/);
              if (arrayMatch) {
                jsonText = arrayMatch[0].trim();
                console.log("从文本中直接提取到JSON数组");
              } 
              // 方法3: 如果以上都失败，尝试使用整个响应
              else {
                jsonText = responseText.trim();
                console.log("使用整个响应作为JSON");
              }
            }
            
            // 清理JSON文本，移除可能导致解析错误的内容
            jsonText = jsonText.replace(/^```json\s*/g, '').replace(/```$/g, '');
            
            // 检查JSON格式是否有效，必须以"["开头，"]"结尾
            if (!jsonText.trim().startsWith('[') || !jsonText.trim().endsWith(']')) {
              console.log("JSON格式不符合数组要求，尝试查找数组部分");
              // 尝试找到第一个"["和最后一个"]"之间的内容
              const startIndex = jsonText.indexOf('[');
              const endIndex = jsonText.lastIndexOf(']');
              
              if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
                jsonText = jsonText.substring(startIndex, endIndex + 1);
                console.log("提取到JSON数组部分");
              } else {
                throw new Error("找不到有效的JSON数组格式");
              }
            }
            
            try {
              // 尝试解析JSON
              questions = JSON.parse(jsonText);
              console.log("JSON解析成功");
            } catch (parseError: any) {
              console.error("标准JSON解析失败，尝试使用AI修复:", parseError);
              
              try {
                // 调用JSON修复API
                console.log("调用JSON修复服务...");
                const response = await fetch('/api/json-fixer', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ 
                    brokenJson: jsonText,
                    errorMessage: parseError.message,
                    apiKey,
                    model
                  }),
                });
                
                const result = await response.json();
                
                if (!response.ok || !result.success) {
                  throw new Error(result.error || '修复JSON失败');
                }
                
                // 解析修复后的JSON
                questions = JSON.parse(result.fixedJson);
                console.log("使用AI修复的JSON解析成功");
              } catch (fixError: any) {
                console.error("AI修复JSON失败:", fixError);
                // 如果修复也失败了，尝试基本的修复方法
                console.log("尝试基本修复方法...");
                
                // 1. 清理可能的Unicode字符或不可见字符
                let fixedJson = jsonText.replace(/[\u0000-\u0019]+/g, " ");
                // 2. 修复常见的逗号问题
                fixedJson = fixedJson.replace(/,\s*}/g, "}").replace(/,\s*\]/g, "]");
                // 3. 确保属性名使用双引号
                fixedJson = fixedJson.replace(/(\w+):/g, "\"$1\":");
                
                // 尝试解析修复后的JSON
                questions = JSON.parse(fixedJson);
                console.log("基本修复后的JSON解析成功");
              }
            }
            
            // 对选项内容进行预处理，确保不包含选项序号
            questions = questions.map(q => {
              // 对选择题进行处理
              if ((q.type === 'choice' || q.type === 'multiChoice') && Array.isArray(q.options)) {
                // 移除选项内容中可能存在的选项序号
                q.options = q.options.map(opt => 
                  typeof opt === 'string' ? opt.replace(/^[A-Z]\.?\s+/i, '') : opt
                );
              }
              return q;
            });
            
            // 计算总分
            totalScore = questions.reduce((sum, q) => sum + (q.score || 0), 0);
            console.log(`成功解析出 ${questions.length} 道题目，总分: ${totalScore}`);
          } catch (jsonError) {
            console.error("AI返回的JSON解析失败:", jsonError);
            console.error("原始响应内容:", responseText);
            throw new Error("解析AI返回的JSON失败，请检查图片质量或尝试使用文本格式的试卷。");
          }
          
          return {
            questions,
            totalScore,
            success: true
          };
        } catch (error: any) {
          console.error(`API调用失败 (尝试 ${i+1}/${retries}):`, error);
          
          // 如果这是最后一次尝试，抛出错误
          if (i === retries - 1) {
            throw error;
          }
          
          // 添加指数退避延迟
          const retryDelay = delay * Math.pow(2, i);
          console.log(`将在 ${retryDelay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
      
      // 如果所有重试都失败，返回错误结果
      throw new Error("多次尝试调用API失败");
    };

    // 执行带重试的API调用
    return await retryAPICall();
    
  } catch (error: any) {
    console.error("试卷图片解析错误:", error);
    
    // 返回错误信息
    return {
      questions: [],
      totalScore: 0,
      success: false,
      error: error.message || "解析试卷图片时发生未知错误"
    };
  }
}

/**
 * 从文件中提取文本内容
 * 支持txt、docx和pdf格式
 * @param file 文件对象
 * @returns 文件的文本内容
 */
export async function extractTextFromFile(file: File): Promise<string> {
  // 根据文件类型选择不同的解析方法
  const fileType = file.name.split('.').pop()?.toLowerCase();

  if (fileType === 'txt') {
    // 处理纯文本文件
    return await file.text();
  } else if (fileType === 'pdf') {
    // 处理PDF文件
    return await extractTextFromPDF(file);
  } else if (fileType === 'docx') {
    // 处理DOCX文件
    return await extractTextFromDOCX(file);
  } else {
    throw new Error(`暂不支持${fileType}格式的解析，请将文件内容手动输入或转换为支持的格式。`);
  }
}

/**
 * 从PDF文件中提取文本
 * @param file PDF文件对象
 * @returns PDF文件中的文本内容
 */
async function extractTextFromPDF(file: File): Promise<string> {
  // 确保只在客户端环境执行
  if (typeof window === 'undefined') {
    throw new Error('PDF解析只能在浏览器环境执行');
  }

  try {
    // 动态导入pdfjs-dist (使用异步动态导入确保SSR兼容性)
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf').catch(err => {
      console.error('动态导入PDF.js失败:', err);
      throw new Error(`无法加载PDF解析库: ${err.message}`);
    });

    // 设置PDF.js worker路径 - 使用动态版本号
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

    // 将文件转换为ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // 加载PDF文档
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';

    // 遍历PDF的每一页并提取文本
    for (let i = 1; i <= pdf.numPages; i++) {
      // 获取页面
      const page = await pdf.getPage(i);
      // 提取页面文本内容
      const textContent = await page.getTextContent();
      // 将文本项拼接成字符串
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      fullText += pageText + '\n\n';
    }

    return fullText.trim();
  } catch (error: any) {
    console.error('PDF解析错误:', error);
    throw new Error(`PDF文件解析失败: ${error.message}`);
  }
}

/**
 * 从DOCX文件中提取文本
 * @param file DOCX文件对象
 * @returns DOCX文件中的文本内容
 */
async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    // 将文件转换为ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    // 使用mammoth解析DOCX文件
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  } catch (error: any) {
    console.error('DOCX解析错误:', error);
    throw new Error(`DOCX文件解析失败: ${error.message}`);
  }
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
我需要你帮助修复一个格式错误的JSON字符串。这个字符串应该是一个试卷题目的数组，但解析失败了。

解析错误信息: ${errorMessage}

需要修复的JSON:
${processedJson}

你的任务是返回一个有效的、格式正确的JSON数组，其中包含试卷题目数据。每个题目对象应该有这些字段：
- id: 题号（字符串）
- type: 题型（'choice', 'multiChoice', 'fill', 'shortAnswer', 'essay'中的一种）
- content: 题目内容
- options: 选项数组（仅适用于选择题）
- answer: 标准答案
- score: 分值（数字）

仅返回修复后的JSON数组，不要添加任何解释、注释或代码块标记。确保所有属性名和字符串值都使用双引号，JSON格式完全符合标准。
`;

    // 调用OpenAI API
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "你是一个专业的JSON修复专家，擅长修复格式错误的JSON。" },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
    });

    // 提取回答内容
    const responseText = completion.choices[0]?.message?.content || '';
    
    // 尝试提取有效的JSON数组
    // 首先检查是否整个响应就是一个JSON数组
    if (responseText.trim().startsWith('[') && responseText.trim().endsWith(']')) {
      // 验证是否为有效JSON
      JSON.parse(responseText); // 如果无效会抛出异常
      return responseText;
    }
    
    // 尝试提取方括号包围的部分
    const arrayMatch = responseText.match(/\[\s*{[\s\S]*}\s*\]/);
    if (arrayMatch) {
      const jsonText = arrayMatch[0];
      // 验证提取的部分是否为有效JSON
      JSON.parse(jsonText); // 如果无效会抛出异常
      return jsonText;
    }
    
    // 如果以上方法都失败，抛出错误
    throw new Error("无法提取有效的JSON数组");
  } catch (error: any) {
    console.error("JSON修复失败:", error);
    throw new Error(`无法修复JSON格式: ${error.message}`);
  }
}
