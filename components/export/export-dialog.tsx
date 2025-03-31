"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Download, FileText, Table } from "lucide-react"

interface ExportDialogProps {
  examId: string
  examName: string
  onExport: (format: string, options: any) => Promise<void>
}

export function ExportDialog({ examId, examName, onExport }: ExportDialogProps) {
  const [format, setFormat] = useState("pdf")
  const [isExporting, setIsExporting] = useState(false)
  const [options, setOptions] = useState({
    includeStudentInfo: true,
    includeQuestions: true,
    includeAnswers: true,
    includeScores: true,
    includeFeedback: true,
    includeStatistics: true,
  })

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await onExport(format, options)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          导出
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>导出考试数据</DialogTitle>
          <DialogDescription>选择导出格式和内容选项</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="export-format">导出格式</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger id="export-format">
                <SelectValue placeholder="选择导出格式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>PDF 文档</span>
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center">
                    <Table className="mr-2 h-4 w-4" />
                    <span>Excel 表格</span>
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center">
                    <Table className="mr-2 h-4 w-4" />
                    <span>CSV 文件</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>导出内容</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="student-info"
                  checked={options.includeStudentInfo}
                  onCheckedChange={(checked) => setOptions({ ...options, includeStudentInfo: !!checked })}
                />
                <Label htmlFor="student-info">学生信息</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="questions"
                  checked={options.includeQuestions}
                  onCheckedChange={(checked) => setOptions({ ...options, includeQuestions: !!checked })}
                />
                <Label htmlFor="questions">题目内容</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="answers"
                  checked={options.includeAnswers}
                  onCheckedChange={(checked) => setOptions({ ...options, includeAnswers: !!checked })}
                />
                <Label htmlFor="answers">学生答案</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="scores"
                  checked={options.includeScores}
                  onCheckedChange={(checked) => setOptions({ ...options, includeScores: !!checked })}
                />
                <Label htmlFor="scores">评分结果</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feedback"
                  checked={options.includeFeedback}
                  onCheckedChange={(checked) => setOptions({ ...options, includeFeedback: !!checked })}
                />
                <Label htmlFor="feedback">评语反馈</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="statistics"
                  checked={options.includeStatistics}
                  onCheckedChange={(checked) => setOptions({ ...options, includeStatistics: !!checked })}
                />
                <Label htmlFor="statistics">统计数据</Label>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? "导出中..." : "导出"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

