import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { comunidadService } from '../services/comunidadService';
import { useUIStore } from '../store/uiStore';
import { PostComunidad, PostDTO } from '../types/comunidad';
import { 
  Users, 
  Heart, 
  MessageSquare, 
  Send, 
  Loader2,
  Plus,
  Filter,
  TrendingUp,
  Video
} from 'lucide-react';

export default function ComunidadPage() {
  const { addToast } = useUIStore();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostComunidad[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState<PostDTO>({
    titulo: '',
    contenido: '',
    categoria: '',
  });

  useEffect(() => {
    loadData();
  }, [selectedCategoria]);

  const loadData = async () => {
    try {
      const [postsData, categoriasData] = await Promise.all([
        comunidadService.getPosts(selectedCategoria || undefined),
        comunidadService.getCategorias(),
      ]);
      
      setPosts(postsData);
      setCategorias(categoriasData);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los posts',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const updatedPost = await comunidadService.addLike(postId);
      setPosts(posts.map(post => 
        post.id === postId ? updatedPost : post
      ));
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo dar like',
      });
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPost.titulo.trim() || !newPost.contenido.trim() || !newPost.categoria) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Completa todos los campos',
      });
      return;
    }

    try {
      const createdPost = await comunidadService.createPost(newPost);
      setPosts([createdPost, ...posts]);
      setShowNewPost(false);
      setNewPost({ titulo: '', contenido: '', categoria: '' });
      
      addToast({
        type: 'success',
        title: 'Post creado',
        message: 'Tu post ha sido publicado',
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo crear el post',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner h-12 w-12"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Comunidad y Foros</h1>
          <p className="text-muted-foreground">
            Comparte experiencias y participa en foros de discusión
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/videos')}
            className="flex items-center space-x-2 px-4 py-2 bg-secondary rounded-lg hover:bg-accent transition-colors"
          >
            <Video className="h-4 w-4" />
            <span>Ver Videos</span>
          </button>
          <button
            onClick={() => setShowNewPost(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Post</span>
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategoria('')}
          className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
            selectedCategoria === '' 
              ? 'bg-primary text-white' 
              : 'bg-secondary hover:bg-accent'
          }`}
        >
          Todos
        </button>
        {categorias.map((categoria) => (
          <button
            key={categoria}
            onClick={() => setSelectedCategoria(categoria)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              selectedCategoria === categoria 
                ? 'bg-primary text-white' 
                : 'bg-secondary hover:bg-accent'
            }`}
          >
            {categoria}
          </button>
        ))}
      </div>

      {/* New Post Form */}
      {showNewPost && (
        <div className="bg-card rounded-xl p-6 border">
          <h3 className="text-lg font-semibold mb-4">Crear Nuevo Post</h3>
          <form onSubmit={handleSubmitPost} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Título</label>
              <input
                type="text"
                value={newPost.titulo}
                onChange={(e) => setNewPost({ ...newPost, titulo: e.target.value })}
                maxLength={200}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Título de tu post..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                {newPost.titulo.length}/200 caracteres
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Categoría</label>
              <select
                value={newPost.categoria}
                onChange={(e) => setNewPost({ ...newPost, categoria: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Contenido</label>
              <textarea
                value={newPost.contenido}
                onChange={(e) => setNewPost({ ...newPost, contenido: e.target.value })}
                maxLength={2000}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="Comparte tu experiencia..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                {newPost.contenido.length}/2000 caracteres
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex-1 bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Publicar
              </button>
              <button
                type="button"
                onClick={() => setShowNewPost(false)}
                className="px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No hay posts en esta categoría. ¡Sé el primero en compartir!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onLike={handleLike} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({ post, onLike }: any) {
  const timeAgo = getTimeAgo(new Date(post.fecha));

  return (
    <div className="bg-card rounded-xl p-6 border hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
            {post.usuario?.nombre?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="font-medium">{post.usuario?.nombre || 'Anónimo'}</p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
        <span className="text-xs bg-secondary px-2 py-1 rounded-full">
          {post.categoria}
        </span>
      </div>

      <h3 className="text-lg font-semibold mb-2">{post.titulo}</h3>
      <p className="text-muted-foreground mb-4">{post.contenido}</p>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onLike(post.id)}
            className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <Heart className="h-4 w-4" />
            <span>{post.likes}</span>
          </button>
          <button className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors">
            <MessageSquare className="h-4 w-4" />
            <span>{post.comentarios?.length || 0}</span>
          </button>
        </div>
        <button className="text-sm text-muted-foreground hover:text-primary transition-colors">
          Ver comentarios
        </button>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'ahora mismo';
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`;
  if (seconds < 604800) return `hace ${Math.floor(seconds / 86400)} días`;
  
  return date.toLocaleDateString('es-ES');
}
