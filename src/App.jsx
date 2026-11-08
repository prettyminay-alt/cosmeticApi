import { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Link, NavLink, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './App.css'

const FAVORITES_KEY = 'glowify-favorites'
const FavoritesContext = createContext(null)

function formatPrice(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function getProductPrice(product) {
  return product?.discountPercentage
    ? product.price - (product.price * product.discountPercentage) / 100
    : product?.price || 0
}

function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
      return Array.isArray(saved) ? saved : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  }, [favorites])

  const toggleFavorite = (product) => {
    setFavorites((prev) => {
      const exists = prev.some((item) => item.id === product.id)
      if (exists) {
        return prev.filter((item) => item.id !== product.id)
      }
      return [product, ...prev]
    })
  }

  const removeFavorite = (id) => {
    setFavorites((prev) => prev.filter((item) => item.id !== id))
  }

  const isFavorite = (id) => favorites.some((item) => item.id === id)

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}

function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('FavoritesContext must be used within FavoritesProvider')
  }
  return context
}

function SearchBar({ compact = false, value = '', onChange = null, onSubmit = null, placeholder = 'Search beauty essentials' }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState(value)

  useEffect(() => {
    setQuery(value)
  }, [value])

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = (onSubmit ? value : query).trim()
    if (onSubmit) {
      onSubmit(trimmed)
      return
    }
    navigate(trimmed ? `/products?search=${encodeURIComponent(trimmed)}` : '/products')
  }

  return (
    <form className={`search-bar ${compact ? 'compact' : ''}`} onSubmit={handleSubmit}>
      <button type="submit" className="search-button" aria-label="Search products">
        <i className="bi bi-search"></i>
      </button>
      <input
        type="text"
        value={onChange ? value : query}
        onChange={(event) => {
          const nextValue = event.target.value
          if (onChange) onChange(nextValue)
          else setQuery(nextValue)
        }}
        placeholder={placeholder}
        aria-label="Search beauty products"
      />
    </form>
  )
}

function ProductCard({ product }) {
  const { toggleFavorite, isFavorite } = useFavorites()
  const favorite = isFavorite(product.id)
  const salePrice = getProductPrice(product)

  return (
    <div className="product-card">
      <div className="product-image-wrap">
        <img src={product.thumbnail} alt={product.title} className="product-image" />
        {product.discountPercentage ? (
          <span className="discount-badge">-{Math.round(product.discountPercentage)}%</span>
        ) : null}
        <button
          type="button"
          className={`favorite-button ${favorite ? 'active' : ''}`}
          onClick={() => toggleFavorite(product)}
          aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <i className={favorite ? 'bi bi-heart-fill' : 'bi bi-heart'}></i>
        </button>
      </div>

      <div className="product-body">
        <div className="product-meta-row">
          <span className="product-category">{product.category}</span>
          <span className="product-rating">
            <i className="bi bi-star-fill"></i> {product.rating}
          </span>
        </div>

        <h3>{product.title}</h3>

        <div className="product-price-row">
          <strong>{formatPrice(salePrice)}</strong>
          {product.discountPercentage ? <span>{formatPrice(product.price)}</span> : null}
        </div>

        <div className="product-actions">
          <Link to={`/product/${product.id}`} className="btn btn-primary btn-sm rounded-pill">
            View details
          </Link>
        </div>
      </div>
    </div>
  )
}

function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [beautyResponse, categoriesResponse] = await Promise.all([
          fetch('https://dummyjson.com/products/category/beauty?limit=12'),
          fetch('https://dummyjson.com/products/categories'),
        ])

        const beautyData = await beautyResponse.json()
        const categoryData = await categoriesResponse.json()

        const beautyTypeSet = ['beauty', 'skincare', 'fragrance', 'haircare', 'makeup', 'perfume']
        const relevantCategories = Array.isArray(categoryData)
          ? categoryData.filter((category) => beautyTypeSet.includes(category)).slice(0, 4)
          : ['beauty', 'skincare', 'fragrance']

        setFeaturedProducts(Array.isArray(beautyData.products) ? beautyData.products.slice(0, 4) : [])
        setCategories(relevantCategories.length ? relevantCategories : ['beauty', 'skincare', 'fragrance'])
      } catch (error) {
        console.error('Home page data error:', error)
        setFeaturedProducts([])
        setCategories(['beauty', 'skincare', 'fragrance'])
      } finally {
        setLoading(false)
      }
    }

    fetchHomeData()
  }, [])

  return (
    <>
      <section className="hero-section container-fluid">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">Glowify Beauty</span>
            <h1>Discover Your Beauty Essentials</h1>
            <p>Explore beauty products that complement your everyday glow.</p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary rounded-pill px-4 py-2">
                Shop now
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="beauty-card card-large">
              <div className="card-top">
                <span>Glow Ritual</span>
                <i className="bi bi-sparkles"></i>
              </div>
              <img src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80" alt="Beauty products" />
            </div>
          </div>
        </div>
      </section>

      <main className="container main-content">
        <section className="section-block">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Featured</span>
              <h2>Best sellers for your routine</h2>
            </div>
            <Link to="/products" className="text-link">Explore all</Link>
          </div>

          {loading ? (
            <div className="loading-box">Loading featured products...</div>
          ) : (
            <div className="products-grid featured-grid">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        <section className="section-block categories-block">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Categories</span>
              <h2>Beauty collections</h2>
            </div>
          </div>
          <div className="category-grid">
            {categories.map((category) => (
              <Link key={category} to={`/products?category=${encodeURIComponent(category)}`} className="category-card">
                <div className="category-icon">
                  <i className="bi bi-flower1"></i>
                </div>
                <div>
                  <h3>{category}</h3>
                  <span>Browse essentials</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}

function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all')
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [sortBy, setSortBy] = useState('featured')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '')

  const productsPerPage = 12

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('https://dummyjson.com/products/categories')
        const data = await response.json()

        const beautyCategories = Array.isArray(data)
          ? data.filter((category) => ['beauty', 'skincare', 'fragrance', 'makeup', 'haircare', 'perfume'].includes(category))
          : ['beauty', 'skincare', 'fragrance']

        setCategories(beautyCategories.length ? beautyCategories : ['beauty', 'skincare', 'fragrance'])
      } catch {
        setCategories(['beauty', 'skincare', 'fragrance'])
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    const nextCategory = searchParams.get('category') || 'all'
    const nextSearch = searchParams.get('search') || ''
    setSelectedCategory(nextCategory)
    setSearchTerm(nextSearch)
    setLocalSearch(nextSearch)
  }, [searchParams])

  const applySearch = (value) => {
    const nextValue = value.trim()
    setLocalSearch(nextValue)
    const params = new URLSearchParams(searchParams)
    if (nextValue) params.set('search', nextValue)
    else params.delete('search')
    setSearchParams(params)
  }

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      setError('')

      try {
        const url = searchTerm
          ? `https://dummyjson.com/products/search?q=${encodeURIComponent(searchTerm)}`
          : 'https://dummyjson.com/products?limit=100'

        const response = await fetch(url)
        const data = await response.json()
        let results = Array.isArray(data.products) ? data.products : []

        if (selectedCategory !== 'all') {
          results = results.filter((product) => product.category === selectedCategory)
        }

        results = [...results].sort((a, b) => {
          switch (sortBy) {
            case 'price-low':
              return getProductPrice(a) - getProductPrice(b)
            case 'price-high':
              return getProductPrice(b) - getProductPrice(a)
            case 'rating':
              return (b.rating || 0) - (a.rating || 0)
            case 'name-az':
              return a.title.localeCompare(b.title)
            case 'name-za':
              return b.title.localeCompare(a.title)
            default:
              return 0
          }
        })

        setProducts(results)
        setCurrentPage(1)
      } catch (err) {
        console.error('Product fetch error:', err)
        setError('We could not load products right now. Please try again.')
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [searchTerm, selectedCategory, sortBy])

  const totalPages = Math.max(1, Math.ceil(products.length / productsPerPage))
  const paginatedProducts = products.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage)

  const updateCategory = (category) => {
    const params = new URLSearchParams(searchParams)
    if (category === 'all') params.delete('category')
    else params.set('category', category)
    setSearchParams(params)
  }

  const clearFilters = () => {
    setSearchParams({})
    setSearchTerm('')
    setLocalSearch('')
    setSelectedCategory('all')
    setSortBy('featured')
  }

  return (
    <main className="container main-content">
      <section className="section-block catalog-bar">
        <div className="catalog-controls">
          <div className="control-group search-group">
            <label htmlFor="catalog-search">Search</label>
            <SearchBar
              value={localSearch}
              onChange={setLocalSearch}
              onSubmit={applySearch}
              placeholder="Search by product name"
            />
          </div>

          <div className="control-group">
            <label htmlFor="categoryFilter">Category</label>
            <select
              id="categoryFilter"
              value={selectedCategory}
              onChange={(event) => updateCategory(event.target.value)}
            >
              <option value="all">All products</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="sortBy">Sort by</label>
            <select id="sortBy" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="name-az">Name: A to Z</option>
              <option value="name-za">Name: Z to A</option>
            </select>
          </div>
        </div>

        <div className="catalog-toolbar">
          <button type="button" className="btn btn-outline-secondary rounded-pill" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      </section>

      {loading ? (
        <div className="loading-box">Loading beauty products...</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-search display-5"></i>
          <h3>No products match your search.</h3>
          <p>Try another keyword or choose a different category.</p>
        </div>
      ) : (
        <>
          <div className="results-summary">
            Showing {(currentPage - 1) * productsPerPage + 1}-{Math.min(currentPage * productsPerPage, products.length)} of {products.length} products
          </div>

          <div className="products-grid">
            {paginatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <nav className="pagination-wrap" aria-label="Pagination">
            <button
              type="button"
              className="btn btn-light rounded-pill"
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            <span className="page-indicator">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              className="btn btn-light rounded-pill"
              onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
              disabled={currentPage >= totalPages}
            >
              Next
            </button>
          </nav>
        </>
      )}
    </main>
  )
}

function ProductDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toggleFavorite, isFavorite } = useFavorites()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(`https://dummyjson.com/products/${id}`)
        if (!response.ok) {
          throw new Error('Product not found')
        }

        const data = await response.json()
        setProduct(data)
      } catch (err) {
        console.error('Product detail fetch error:', err)
        setError('This beauty product could not be found. Please check the product link.')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  if (loading) {
    return <div className="loading-box">Loading product details...</div>
  }

  if (error || !product) {
    return (
      <main className="container main-content">
        <div className="empty-state">
          <h3>Product unavailable</h3>
          <p>{error || 'We could not load this product.'}</p>
          <button type="button" className="btn btn-primary rounded-pill" onClick={() => navigate('/products')}>
            Back to products
          </button>
        </div>
      </main>
    )
  }

  const salePrice = getProductPrice(product)
  const favorite = isFavorite(product.id)

  return (
    <main className="container main-content">
      <button type="button" className="btn btn-link back-link" onClick={() => navigate('/products')}>
        <i className="bi bi-arrow-left"></i> Back to products
      </button>

      <section className="product-details-card">
        <div className="product-detail-image-wrap">
          <img src={product.thumbnail} alt={product.title} className="product-detail-image" />
        </div>

        <div className="product-detail-content">
          <span className="eyebrow">{product.category}</span>
          <h1>{product.title}</h1>
          <div className="detail-rating-row">
            <span><i className="bi bi-star-fill"></i> {product.rating}</span>
            <span>{product.stock} in stock</span>
          </div>

          <div className="product-price-row detail-price">
            <strong>{formatPrice(salePrice)}</strong>
            {product.discountPercentage ? <span>{formatPrice(product.price)}</span> : null}
          </div>

          <p className="product-description">{product.description}</p>

          <div className="detail-meta-grid">
            <div>
              <span className="label">Brand</span>
              <strong>{product.brand || 'Glowify'}</strong>
            </div>
            <div>
              <span className="label">Discount</span>
              <strong>{product.discountPercentage ? `${Math.round(product.discountPercentage)}%` : 'No discount'}</strong>
            </div>
            <div>
              <span className="label">Stock</span>
              <strong>{product.stock}</strong>
            </div>
          </div>

          <div className="detail-actions">
            <button type="button" className="btn btn-primary rounded-pill px-4" onClick={() => toggleFavorite(product)}>
              <i className={favorite ? 'bi bi-heart-fill' : 'bi bi-heart'}></i>
              {favorite ? 'Saved to favorites' : 'Add to favorites'}
            </button>
            <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => navigate('/products')}>
              Continue shopping
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

function FavoritesPage() {
  const { favorites, removeFavorite } = useFavorites()

  return (
    <main className="container main-content">
      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Favorites</span>
            <h2>Your saved beauty picks</h2>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-heart display-5"></i>
            <h3>No favorites yet</h3>
            <p>Save your favorite beauty finds and keep them close.</p>
            <Link to="/products" className="btn btn-primary rounded-pill">
              Explore products
            </Link>
          </div>
        ) : (
          <div className="favorites-list">
            {favorites.map((product) => (
              <div key={product.id} className="favorite-item">
                <img src={product.thumbnail} alt={product.title} />
                <div className="favorite-item-content">
                  <h3>{product.title}</h3>
                  <p>{product.category}</p>
                  <div className="product-price-row">
                    <strong>{formatPrice(getProductPrice(product))}</strong>
                  </div>
                </div>
                <div className="favorite-item-actions">
                  <Link to={`/product/${product.id}`} className="btn btn-primary btn-sm rounded-pill">
                    View details
                  </Link>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm rounded-pill"
                    onClick={() => removeFavorite(product.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function AppLayout() {
  const { favorites } = useFavorites()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="container nav-container">
          <Link to="/" className="brand" aria-label="Glowify home">
            <span className="brand-mark">G</span>
            Glowify
          </Link>

          <button
            type="button"
            className="mobile-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            <i className="bi bi-list"></i>
          </button>

          <nav className={`main-nav ${menuOpen ? 'open' : ''}`}>
            <NavLink to="/" end className="nav-link">
              Home
            </NavLink>
            <NavLink to="/products" className="nav-link">
              Explore Products
            </NavLink>
            <NavLink to="/favorites" className="nav-link favorites-link">
              Favorites
              <span className="favorites-count">{favorites.length}</span>
            </NavLink>
          </nav>

          <div className="nav-tools">
            <SearchBar />
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ExplorePage />} />
        <Route path="/product/:id" element={<ProductDetailsPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
      </Routes>

      <footer className="site-footer">
        <div className="container footer-content">
          <div>
            <h3>Glowify</h3>
            <p>Modern beauty essentials curated for every routine.</p>
          </div>
          <div>
            <h4>Explore</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/products">Products</Link></li>
              <li><Link to="/favorites">Favorites</Link></li>
            </ul>
          </div>
          <div>
            <h4>API</h4>
            <ul>
              <li><a href="https://dummyjson.com/docs/products" target="_blank" rel="noreferrer">DummyJSON</a></li>
              <li><a href="https://dummyjson.com/products/category/beauty" target="_blank" rel="noreferrer">Beauty catalog</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">© 2026 Glowify. All rights reserved.</div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <FavoritesProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </FavoritesProvider>
  )
}

export default App
