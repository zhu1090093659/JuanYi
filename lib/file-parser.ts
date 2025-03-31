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

请确保输出是有效的JSON格式，仅包含解析后的题目数组，不要包含其他文本。
请使用markdown代码块格式返回JSON数组，例如：
\`\`\`json
[{"id": "1", ...}]
\`\`\`
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
            // 处理可能包含在代码块中的JSON
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, responseText];
            const jsonText = jsonMatch[1].trim();
            
            questions = JSON.parse(jsonText);
            
            // 计算总分
            totalScore = questions.reduce((sum, q) => sum + (q.score || 0), 0);
            console.log(`成功解析出 ${questions.length} 道题目，总分: ${totalScore}`);
          } catch (jsonError) {
            console.error("AI返回的JSON解析失败:", jsonError);
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

    // 设置PDF.js worker路径 - 使用CDN
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

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
