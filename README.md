# Universal File Analyzer

Universal File Analyzer and Multi-Page Source Code PDF Generator for APK, ZIP, DEX, XML, and code files.

## 📱 Build Real Android APK (GitHub Actions)

A GitHub Actions workflow is pre-configured in `.github/workflows/build-apk.yml`.

### How to build and download the APK:
1. Push this project to your GitHub repository:
   ```bash
   git add .
   git commit -m "Add Android APK build workflow"
   git push origin main
   ```
2. Open your repository on GitHub.
3. Go to the **Actions** tab.
4. Select **Build Android APK** from the left sidebar.
5. Click **Run workflow** -> **Run workflow**.
6. When the job finishes (typically 2–3 minutes), click on the completed run.
7. Under **Artifacts**, download `UniversalFileAnalyzer-APK`.
8. Transfer the `.apk` to your Android phone (or download directly from your mobile browser) and tap to install!

## 📂 Mobile Download & File Selection
- **Open Downloads Folder**: Tapping anywhere on the upload area on your phone instantly opens your mobile's file manager / Downloads folder.
- **Save to Downloads**: Tapping "Download PDF" saves the multi-page formatted code PDF directly into your phone's native `/Download` directory.
