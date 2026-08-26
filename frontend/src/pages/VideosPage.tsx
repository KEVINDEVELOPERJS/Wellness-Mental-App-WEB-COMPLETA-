import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { videos, categorias, forumPosts, Video, ForumPost } from '../data/videos';
import { useUIStore } from '../store/uiStore';
import { 
  Play, 
  Clock, 
  Eye, 
  Calendar,
  Filter,
  Search,
  MessageCircle,
  Share2,
  Bookmark,
  TrendingUp,
  Heart,
  Send,
  User
} from 'lucide-react';

export default function VideosPage() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForum, setShowForum] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const filteredVideos = videos.filter(video => {
    const matchesCategory = selectedCategory === 'Todas' || video.categoria === selectedCategory;
    const matchesSearch = video.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
    setShowForum(false);
  };

  const handleShare = (video: Video) => {
    if (typeof window !== 'undefined' && navigator.share) {
      navigator.share({
        title: video.titulo,
        text: video.descripcion,
        url: window.location.href
      });
    } else {
      addToast({
        type: 'info',
        title: 'Compartir',
        message: 'Enlace copiado al portapapeles'
      });
    }
  };

  const handleBookmark = (video: Video) => {
    addToast({
      type: 'success',
      title: 'Guardado',
      message: 'Video guardado en tus favoritos'
    });
  };

  const handleOpenForum = (video: Video) => {
    setSelectedVideo(video);
    setShowForum(true);
  };

  const handleAddComment = () => {
    if (!selectedVideo || !newComment.trim()) return;
    
    const newPost: ForumPost = {
      id: `${selectedVideo.id}-${Date.now()}`,
      videoId: selectedVideo.id,
      usuario: 'Usuario Actual', // En producción vendría del auth
      contenido: newComment,
      fecha: new Date().toISOString().split('T')[0],
      likes: 0,
      respuestas: []
    };
    
    if (!forumPosts[selectedVideo.id]) {
      forumPosts[selectedVideo.id] = [];
    }
    
    forumPosts[selectedVideo.id].unshift(newPost);
    setNewComment('');
    
    addToast({
      type: 'success',
      title: 'Comentario agregado',
      message: 'Tu comentario ha sido publicado en el foro'
    });
  };

  const handleLikePost = (videoId: string, postId: string) => {
    const post = forumPosts[videoId]?.find(p => p.id === postId);
    if (post) {
      post.likes += 1;
    }
  };

  if (!isMounted) {
    return <div className="flex items-center justify-center h-full">Cargando...</div>;
  }

  if (selectedVideo && !showForum) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Video Player */}
        <div className="bg-black rounded-xl overflow-hidden aspect-video">
          <video
            src={selectedVideo.url}
            controls
            autoPlay
            className="w-full h-full"
          />
        </div>

        {/* Video Info */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full mb-2 inline-block">
                {selectedVideo.categoria}
              </span>
              <h1 className="text-3xl font-bold mb-2">{selectedVideo.titulo}</h1>
              <p className="text-muted-foreground">{selectedVideo.descripcion}</p>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>{selectedVideo.vistas} vistas</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>{selectedVideo.duracion}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(selectedVideo.fechaPublicacion).toLocaleDateString('es-ES')}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleOpenForum(selectedVideo)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Discutir en Foro</span>
            </button>
            <button
              onClick={() => handleShare(selectedVideo)}
              className="flex items-center space-x-2 px-4 py-2 bg-secondary rounded-lg hover:bg-accent transition-colors"
            >
              <Share2 className="h-4 w-4" />
              <span>Compartir</span>
            </button>
            <button
              onClick={() => handleBookmark(selectedVideo)}
              className="flex items-center space-x-2 px-4 py-2 bg-secondary rounded-lg hover:bg-accent transition-colors"
            >
              <Bookmark className="h-4 w-4" />
              <span>Guardar</span>
            </button>
            <button
              onClick={() => setSelectedVideo(null)}
              className="flex items-center space-x-2 px-4 py-2 bg-secondary rounded-lg hover:bg-accent transition-colors"
            >
              <span>Volver a Videos</span>
            </button>
          </div>
        </div>

        {/* Related Videos */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Videos Relacionados</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {Array.isArray(videos) && videos
              .filter(v => v.id !== selectedVideo.id && v.categoria === selectedVideo.categoria)
              .slice(0, 3)
              .map(video => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={() => handleVideoClick(video)}
                  onOpenForum={handleOpenForum}
                />
              ))}
          </div>
        </div>
      </div>
    );
  }

  if (selectedVideo && showForum) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => setShowForum(false)}
              className="text-sm text-muted-foreground hover:text-primary mb-2"
            >
              ← Volver al video
            </button>
            <h1 className="text-2xl font-bold">Foro: {selectedVideo.titulo}</h1>
            <p className="text-muted-foreground">Comparte tus pensamientos y experiencias sobre este video</p>
          </div>
        </div>

        {/* Forum Content */}
        <div className="bg-card rounded-xl p-6 border">
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Foro de Discusión</h3>
            <p className="text-muted-foreground">Comparte tus pensamientos y experiencias sobre este video</p>
          </div>

          {/* New Comment Form */}
          <div className="mb-6">
            <div className="flex space-x-3">
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe tu comentario..."
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
              <button
                onClick={handleAddComment}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors self-end"
              >
                <Send className="h-4 w-4 mr-2" />
                Publicar
              </button>
            </div>
          </div>

          {/* Existing Comments */}
          <div className="space-y-4">
            {forumPosts[selectedVideo.id]?.length > 0 ? (
              forumPosts[selectedVideo.id].map(post => (
                <div key={post.id} className="bg-secondary/50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary/10 rounded-full p-2">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-medium">{post.usuario}</span>
                          <span className="text-xs text-muted-foreground ml-2">{post.fecha}</span>
                        </div>
                        <button
                          onClick={() => handleLikePost(selectedVideo.id, post.id)}
                          className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-primary"
                        >
                          <Heart className="h-4 w-4" />
                          <span>{post.likes}</span>
                        </button>
                      </div>
                      <p className="text-sm">{post.contenido}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-primary opacity-50" />
                <p>Sé el primero en comentar sobre este video</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Videos Educativos</h1>
        <p className="text-muted-foreground">
          Contenido educativo sobre salud mental y bienestar emocional
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {categorias.map(categoria => (
              <option key={categoria} value={categoria}>{categoria}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Featured Video */}
      {videos.length > 0 && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-5 w-5" />
            <span className="font-semibold">Destacado</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">{videos[0].titulo}</h2>
          <p className="opacity-90 mb-4">{videos[0].descripcion}</p>
          <button
            onClick={() => handleVideoClick(videos[0])}
            className="flex items-center space-x-2 bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
          >
            <Play className="h-4 w-4" />
            <span>Ver Ahora</span>
          </button>
        </div>
      )}

      {/* Video Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map(video => (
          <VideoCard
            key={video.id}
            video={video}
            onClick={() => handleVideoClick(video)}
            onOpenForum={handleOpenForum}
          />
        ))}
      </div>

      {filteredVideos.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No se encontraron videos que coincidan con tu búsqueda.</p>
        </div>
      )}
    </div>
  );
}

function VideoCard({ video, onClick, onOpenForum }: { video: Video; onClick: () => void; onOpenForum: (video: Video) => void }) {
  return (
    <div 
      className="bg-card rounded-xl overflow-hidden border hover:shadow-lg transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative aspect-video bg-black">
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white/20 rounded-full p-4">
            <Play className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {video.duracion}
        </div>
      </div>
      
      <div className="p-4">
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full mb-2 inline-block">
          {video.categoria}
        </span>
        <h3 className="font-semibold mb-2 line-clamp-2">{video.titulo}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{video.descripcion}</p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Eye className="h-3 w-3" />
            <span>{video.vistas}</span>
          </div>
          <div className="flex items-center space-x-1 cursor-pointer hover:text-primary" onClick={(e) => { e.stopPropagation(); onOpenForum(video); }}>
            <MessageCircle className="h-3 w-3" />
            <span>{video.comentariosCount} comentarios</span>
          </div>
        </div>
      </div>
    </div>
  );
}