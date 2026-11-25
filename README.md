# Flora - 一朵花的时间

使用你提供的百合开花视频制作的手势互动网页。捏合拇指与食指、或握拳时花朵合拢；逐渐分开两指可连续控制开花程度。动画加入较慢的平滑过渡。

## 在线部署

此仓库配置了 GitHub Actions。推送到 `main` 后会自动发布到 GitHub Pages，网站地址为 https://blairlily2006-glitch.github.io/flower/。首次发布时，请在仓库 Settings > Pages 中确认 Build and deployment 的 Source 为 GitHub Actions。

## 本地预览

双击 `start.bat`，然后在浏览器打开 http://localhost:4173/。首次使用点击“开启摄像头”并允许浏览器访问摄像头。摄像头不可用时可拖动页面底部的进度条。

网页、视频、MediaPipe 识别库、WASM 与手部模型均保存在项目目录，识别过程在浏览器本机运行。启动本地网页服务需要 Node.js；启动脚本会优先使用系统 Node.js，若没有则使用本机 Codex 附带的 Node.js。
