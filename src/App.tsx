import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import UkeyExplorer from './pages/UkeyExplorer';
import MappingConfigList from './pages/MappingConfigList';
import MapConfigEditor from './pages/MapConfigEditor';
import TemplateEditor from './pages/TemplateEditor';
import DataQualityDashboard from './pages/DataQualityDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/ukeys" replace />} />
          <Route path="ukeys" element={<UkeyExplorer />} />
          <Route path="configs" element={<MappingConfigList />} />
          <Route path="editor" element={<MapConfigEditor />} />
          <Route path="templates" element={<TemplateEditor />} />
          <Route path="quality" element={<DataQualityDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
