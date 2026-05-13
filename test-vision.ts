import { VisionAnalysisTool } from './src/tools/VisionAnalysisTool/VisionAnalysisTool.ts'

const result = await VisionAnalysisTool.call({ image_path: '/root/IMG_1444.jpg', prompt: 'test' }, {} as any)
console.log(JSON.stringify(result, null, 2))
