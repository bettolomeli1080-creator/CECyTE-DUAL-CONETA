import React, { useState, useEffect, useRef } from "react";
import { GoogleGenAI } from "@google/genai";
import { 
  Users, 
  Video, 
  MessageSquare, 
  PlusCircle, 
  Info, 
  Send, 
  Heart, 
  Share2, 
  GraduationCap,
  Building2,
  Play,
  X,
  Sparkles,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { io, Socket } from "socket.io-client";

// Types
interface Experience {
  id: number;
  user_name: string;
  user_role: string;
  content: string;
  image_url?: string;
  created_at: string;
}

interface VideoItem {
  id: number;
  title: string;
  user_name: string;
  video_url: string;
  description?: string;
  created_at: string;
}

interface ChatMessage {
  user: string;
  text: string;
  sessionId: number;
}

interface User {
  name: string;
  email: string;
  role: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("cecyte_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState<"feed" | "videos" | "info">("feed");
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [newPost, setNewPost] = useState({ user_name: user?.name || "", user_role: user?.role || "Alumno", content: "", image_url: "" });
  const [newVideo, setNewVideo] = useState({ title: "", video_url: "", description: "" });

  useEffect(() => {
    if (user) {
      setNewPost(prev => ({ ...prev, user_name: user.name, user_role: user.role }));
    }
  }, [user]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const helpWithText = async () => {
    if (!newPost.content.trim()) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Mejora y profesionaliza el siguiente texto de una experiencia de un alumno de CECyTE Jalisco en educación dual. Mantén el tono positivo y entusiasta. Texto: "${newPost.content}"`,
      });
      if (response.text) {
        setNewPost({ ...newPost, content: response.text.trim() });
      }
    } catch (error) {
      console.error("Error generating text:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    fetchExperiences();
    fetchVideos();

    newSocket.on("new_experience", (experience: Experience) => {
      setExperiences(prev => [experience, ...prev]);
    });

    newSocket.on("new_video", (video: VideoItem) => {
      setVideos(prev => [video, ...prev]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const fetchExperiences = async () => {
    const res = await fetch("/api/experiences");
    const data = await res.json();
    setExperiences(data);
  };

  const fetchVideos = async () => {
    const res = await fetch("/api/videos");
    const data = await res.json();
    setVideos(data);
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/experiences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPost),
    });
    if (res.ok) {
      setShowPostModal(false);
      setNewPost({ user_name: "", user_role: "Alumno", content: "", image_url: "" });
    }
  };

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const res = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newVideo, user_name: user.name }),
    });
    if (res.ok) {
      setShowVideoModal(false);
      setNewVideo({ title: "", video_url: "", description: "" });
    }
  };

  const logout = () => {
    localStorage.removeItem("cecyte_user");
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={(u) => {
      localStorage.setItem("cecyte_user", JSON.stringify(u));
      setUser(u);
    }} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">CECyTE Connect</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Dual Experience</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <NavButton active={activeTab === "feed"} onClick={() => setActiveTab("feed")} icon={<Users size={20} />} label="Muro" />
            <NavButton active={activeTab === "videos"} onClick={() => setActiveTab("videos")} icon={<Video size={20} />} label="Videos" />
            <NavButton active={activeTab === "info"} onClick={() => setActiveTab("info")} icon={<Info size={20} />} label="Info" />
            <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block" />
            <button 
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              title="Cerrar Sesión"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "feed" && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <div className="md:col-span-2 space-y-6">
                {/* Create Post Trigger */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
                  <button 
                    onClick={() => setShowPostModal(true)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 transition-colors text-left px-4 py-2.5 rounded-full text-slate-500 text-sm"
                  >
                    Comparte tu experiencia en el Modelo Dual...
                  </button>
                </div>

                {/* Feed */}
                {experiences.map((exp) => (
                  // @ts-ignore
                  <ExperienceCard key={exp.id} experience={exp} />
                ))}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200">
                  <h3 className="font-bold text-xl mb-2">¿Qué es el Modelo Dual?</h3>
                  <p className="text-indigo-100 text-sm leading-relaxed mb-4">
                    Es una opción educativa donde el alumno se forma tanto en el plantel como en una empresa, adquiriendo competencias profesionales reales.
                  </p>
                  <button 
                    onClick={() => setActiveTab("info")}
                    className="w-full bg-white text-indigo-600 font-bold py-3 rounded-2xl hover:bg-indigo-50 transition-colors text-sm"
                  >
                    Saber más
                  </button>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Video size={18} className="text-indigo-600" />
                    Videos Recientes
                  </h3>
                  <div className="space-y-4">
                    {videos.length > 0 ? videos.slice(0, 3).map(video => (
                      <div key={video.id} className="flex items-center justify-between group cursor-pointer" onClick={() => {setActiveTab("videos"); setActiveVideo(video);}}>
                        <div>
                          <p className="font-semibold text-sm group-hover:text-indigo-600 transition-colors">{video.title}</p>
                          <p className="text-xs text-slate-500">{video.user_name}</p>
                        </div>
                        <Play size={14} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                      </div>
                    )) : (
                      <p className="text-xs text-slate-400 italic">No hay videos disponibles.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "videos" && (
            <motion.div
              key="videos"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]"
            >
              <div className="lg:col-span-3 bg-slate-900 rounded-3xl overflow-hidden relative shadow-2xl flex flex-col">
                {activeVideo ? (
                  <>
                    <div className="flex-1 relative bg-black flex items-center justify-center">
                      <video 
                        src={activeVideo.video_url} 
                        controls 
                        autoPlay 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="p-6 bg-slate-800 border-t border-slate-700">
                      <h2 className="text-white font-bold text-xl">{activeVideo.title}</h2>
                      <p className="text-slate-400 text-sm">Subido por {activeVideo.user_name}</p>
                      {activeVideo.description && <p className="text-slate-300 text-sm mt-2">{activeVideo.description}</p>}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
                    <Video size={48} className="opacity-20" />
                    <p>Selecciona un video para reproducir</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-sm">Galería de Videos</h3>
                  <button 
                    onClick={() => setShowVideoModal(true)}
                    className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <PlusCircle size={18} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {videos.map((v) => (
                    <button 
                      key={v.id} 
                      onClick={() => setActiveVideo(v)}
                      className={`w-full text-left p-3 rounded-2xl transition-all ${activeVideo?.id === v.id ? 'bg-indigo-50 border-indigo-100' : 'hover:bg-slate-50 border-transparent'} border`}
                    >
                      <p className={`font-bold text-sm ${activeVideo?.id === v.id ? 'text-indigo-600' : 'text-slate-900'}`}>{v.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{v.user_name}</p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "info" && (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-3xl mx-auto space-y-12"
            >
              <section className="text-center space-y-4">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Educación Dual en CECyTE</h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Transformando la educación técnica en Jalisco a través de la vinculación real con el sector productivo.
                </p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoCard 
                  icon={<Building2 className="text-blue-600" />} 
                  title="Empresas Aliadas" 
                  description="Más de 100 empresas en Jalisco participan activamente recibiendo a nuestros alumnos."
                />
                <InfoCard 
                  icon={<Users className="text-emerald-600" />} 
                  title="Comunidad" 
                  description="Miles de egresados han iniciado su carrera profesional gracias a este modelo."
                />
              </div>

              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-2xl font-bold">Beneficios para el Alumno</h3>
                <ul className="space-y-4">
                  <BenefitItem text="Desarrollo de competencias profesionales en un entorno real." />
                  <BenefitItem text="Certificación de competencias laborales." />
                  <BenefitItem text="Posibilidad de contratación inmediata al egresar." />
                  <BenefitItem text="Apoyo económico a través de becas de vinculación." />
                </ul>
                <div className="pt-6">
                  <a 
                    href="https://www.cecytejalisco.edu.mx" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:underline"
                  >
                    Visitar sitio oficial de CECyTE Jalisco
                    <Share2 size={16} />
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Button */}
      {activeTab === "feed" && (
        <button 
          onClick={() => setShowPostModal(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
        >
          <PlusCircle size={28} />
        </button>
      )}

      {/* Post Modal */}
      <AnimatePresence>
        {showPostModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPostModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-xl">Nueva Experiencia</h3>
                <button onClick={() => setShowPostModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handlePostSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Nombre</label>
                    <input 
                      required
                      value={newPost.user_name}
                      onChange={e => setNewPost({...newPost, user_name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Rol</label>
                    <select 
                      value={newPost.user_role}
                      onChange={e => setNewPost({...newPost, user_role: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option>Alumno</option>
                      <option>Egresado</option>
                      <option>Empresa</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Contenido</label>
                    <button 
                      type="button"
                      onClick={helpWithText}
                      disabled={isGenerating || !newPost.content.trim()}
                      className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                    >
                      {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      Ayúdame a redactar
                    </button>
                  </div>
                  <textarea 
                    required
                    value={newPost.content}
                    onChange={e => setNewPost({...newPost, content: e.target.value})}
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" 
                    placeholder="¿Cómo ha sido tu experiencia en el Modelo Dual?"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">URL de Imagen (Opcional)</label>
                  <input 
                    value={newPost.image_url}
                    onChange={e => setNewPost({...newPost, image_url: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                  Publicar Experiencia
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Video Modal */}
      <AnimatePresence>
        {showVideoModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVideoModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-xl">Subir Video</h3>
                <button onClick={() => setShowVideoModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleVideoSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Título del Video</label>
                  <input 
                    required
                    value={newVideo.title}
                    onChange={e => setNewVideo({...newVideo, title: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                    placeholder="Ej. Mi recorrido en la planta"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">URL del Video</label>
                  <input 
                    required
                    value={newVideo.video_url}
                    onChange={e => setNewVideo({...newVideo, video_url: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                    placeholder="https://ejemplo.com/video.mp4"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Descripción (Opcional)</label>
                  <textarea 
                    value={newVideo.description}
                    onChange={e => setNewVideo({...newVideo, description: e.target.value})}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" 
                    placeholder="Cuéntanos un poco sobre el video..."
                  />
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                  Subir Video
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
        active ? "bg-indigo-50 text-indigo-600 font-bold" : "text-slate-500 hover:bg-slate-50"
      }`}
    >
      {icon}
      <span className="text-sm hidden sm:inline">{label}</span>
    </button>
  );
}

const ExperienceCard = ({ experience }: { experience: Experience }) => {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              {experience.user_name[0]}
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-none">{experience.user_name}</p>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mt-1">{experience.user_role}</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-400">{new Date(experience.created_at).toLocaleDateString()}</p>
        </div>
        
        <p className="text-slate-600 leading-relaxed text-sm">
          {experience.content}
        </p>

        {experience.image_url && (
          <div className="rounded-2xl overflow-hidden border border-slate-100">
            <img src={experience.image_url} alt="Experience" className="w-full h-auto object-cover max-h-96" referrerPolicy="no-referrer" />
          </div>
        )}

        <div className="pt-4 border-t border-slate-50 flex items-center gap-6">
          <button className="flex items-center gap-1.5 text-slate-400 hover:text-red-500 transition-colors">
            <Heart size={18} />
            <span className="text-xs font-bold">Me gusta</span>
          </button>
          <button className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 transition-colors">
            <MessageSquare size={18} />
            <span className="text-xs font-bold">Comentar</span>
          </button>
          <button className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors ml-auto">
            <Share2 size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

const InfoCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
        {icon}
      </div>
      <h4 className="font-bold text-lg">{title}</h4>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}

const BenefitItem = ({ text }: { text: string }) => {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
      </div>
      <span className="text-slate-600 text-sm">{text}</span>
    </li>
  );
}

function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Alumno");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.toLowerCase().endsWith("@cecytejalisco.edu.mx")) {
      setError("Debes usar una cuenta institucional @cecytejalisco.edu.mx");
      return;
    }
    if (!name.trim()) {
      setError("Por favor ingresa tu nombre completo");
      return;
    }
    onLogin({ name, email, role });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
      >
        <div className="p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-200">
            <GraduationCap size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Bienvenido a CECyTE Connect</h2>
            <p className="text-slate-500 text-sm mt-2">Ingresa con tu cuenta institucional para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Nombre Completo</label>
              <input 
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Ej. Juan Pérez"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Correo Institucional</label>
              <input 
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="usuario@cecytejalisco.edu.mx"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Soy...</label>
              <select 
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                <option>Alumno</option>
                <option>Egresado</option>
                <option>Docente</option>
              </select>
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100"
              >
                {error}
              </motion.p>
            )}

            <button 
              type="submit"
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 group"
            >
              Ingresar
              <Send size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="pt-4">
            <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-widest font-bold">
              Solo para la comunidad CECyTE Jalisco
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
