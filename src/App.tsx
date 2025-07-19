import './App.css'
import { Route, Routes } from 'react-router-dom'
import HomeBCM from './pages/homeBCM'
import BC from './pages/BC'
import CM from './pages/CM'
import SelfSurveyAreaKerjaK3 from './pages/K3/SelfSurveyAreaKerjaK3'
import SelfSurveyPeralatanK3 from './pages/K3/SelfSurveyPeralatanK3'

function App() {

  return (
    <Routes>
      <Route path="/" element={<HomeBCM/>}/>
      <Route path="/BC" element={<BC/>}/>
      <Route path="/CM" element={<CM/>}/>
      <Route path="/K3/SelfSurveyAreaKerja" element={<SelfSurveyAreaKerjaK3/>}/>
      <Route path="/K3/SelfSurveyPeralatan" element={<SelfSurveyPeralatanK3/>}/>
    </Routes>
  )
}

export default App
