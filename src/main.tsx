import React from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import { UserProvider } from './UserContext.tsx'
import BC from './pages/BC/index.tsx'
import CM from './pages/CM/index.tsx'
import HomeBCM from './pages/homeBCM.tsx'
import SelfSurveyAreaKerjaK3 from './pages/K3/SelfSurveyAreaKerjaK3.tsx'
import SelfSurveyPeralatanK3 from './pages/K3/SelfSurveyPeralatanK3.tsx'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider value={defaultSystem}>
      <UserProvider>
        <HashRouter>
        <Routes>
          <Route path="/" element={<HomeBCM/>}/>
          <Route path="BC" element={<BC/>}/>
          <Route path="CM" element={<CM/>}/>
          <Route path="K3/SelfSurveyAreaKerja" element={<SelfSurveyAreaKerjaK3/>}/>
          <Route path="K3/SelfSurveyPeralatan" element={<SelfSurveyPeralatanK3/>}/>
        </Routes>
        </HashRouter>
      </UserProvider>
    </ChakraProvider>
  </React.StrictMode>
)
