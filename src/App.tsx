import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import ProjectList from "@/pages/ProjectList";
import ProjectDetail from "@/pages/ProjectDetail";
import VideoUpload from "@/pages/VideoUpload";
import SubtitleEditor from "@/pages/SubtitleEditor";
import TranslateWorkbench from "@/pages/TranslateWorkbench";
import ReviewWorkbench from "@/pages/ReviewWorkbench";
import ExportCenter from "@/pages/ExportCenter";
import PreviewPlayer from "@/pages/PreviewPlayer";
import ContributorCenter from "@/pages/ContributorCenter";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <MainLayout>
              <ProjectList />
            </MainLayout>
          }
        />
        <Route
          path="/create"
          element={
            <MainLayout>
              <VideoUpload />
            </MainLayout>
          }
        />
        <Route
          path="/contributor"
          element={
            <MainLayout>
              <ContributorCenter />
            </MainLayout>
          }
        />
        <Route
          path="/project/:id"
          element={
            <MainLayout>
              <ProjectDetail />
            </MainLayout>
          }
        />
        <Route
          path="/project/:id/upload"
          element={
            <MainLayout>
              <VideoUpload />
            </MainLayout>
          }
        />
        <Route
          path="/project/:id/editor"
          element={
            <MainLayout>
              <SubtitleEditor />
            </MainLayout>
          }
        />
        <Route
          path="/project/:id/translate"
          element={
            <MainLayout>
              <TranslateWorkbench />
            </MainLayout>
          }
        />
        <Route
          path="/project/:id/review"
          element={
            <MainLayout>
              <ReviewWorkbench />
            </MainLayout>
          }
        />
        <Route
          path="/project/:id/export"
          element={
            <MainLayout>
              <ExportCenter />
            </MainLayout>
          }
        />
        <Route
          path="/project/:id/preview"
          element={
            <MainLayout>
              <PreviewPlayer />
            </MainLayout>
          }
        />
        <Route
          path="*"
          element={
            <MainLayout>
              <div className="text-center py-20">
                <h1 className="text-6xl font-bold text-white mb-4">404</h1>
                <p className="text-dark-400 mb-8">页面不存在</p>
              </div>
            </MainLayout>
          }
        />
      </Routes>
    </Router>
  );
}
