import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Products from './Products';
import AddProduct from './AddProduct';
import ProductDetail from './ProductDetail';

const API_ORIGIN = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
const API_BASE = `${API_ORIGIN}/api`;
const PER_PAGE = 6;

function App() {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const fetchProducts = useCallback(async (signal) => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (selectedCategory) params.append('category', selectedCategory);
      if (minPrice !== '') params.append('min_price', minPrice);
      if (maxPrice !== '') params.append('max_price', maxPrice);
      params.append('page', String(currentPage));
      params.append('per_page', String(PER_PAGE));

      const res = await fetch(`${API_BASE}/products?${params.toString()}`, {
        headers: { Accept: 'application/json' },
        signal,
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setProducts(data);
        setLastPage(1);
        setTotalProducts(data.length);
        setCurrentPage(1);
      } else {
        const nextLastPage = Math.max(1, Number(data?.last_page) || 1);
        const nextCurrentPage = Math.min(
          Math.max(1, Number(data?.current_page) || 1),
          nextLastPage
        );

        setProducts(Array.isArray(data?.data) ? data.data : []);
        setLastPage(nextLastPage);
        setTotalProducts(Number(data?.total) || 0);
        if (nextCurrentPage !== currentPage) {
          setCurrentPage(nextCurrentPage);
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Fetch error:', err);
      setError('Could not load products from the server.');
      setProducts([]);
      setLastPage(1);
      setTotalProducts(0);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [searchTerm, selectedCategory, minPrice, maxPrice, currentPage]);

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal);
    return () => controller.abort();
  }, [fetchProducts]);

  const handleAddToCart = (product) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        return prev.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setCurrentPage(1);
  };

  const handleProductSaved = () => {
    setEditingProduct(null);
    fetchProducts();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Delete failed with status ${res.status}`);
      }

      if (editingProduct?.id === id) {
        setEditingProduct(null);
      }
      await fetchProducts();
    } catch (err) {
      console.error('Delete error:', err);
      window.alert('Failed to delete product');
    }
  };

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    Boolean(selectedCategory) ||
    minPrice !== '' ||
    maxPrice !== '';

  const pageNumbers = Array.from({ length: lastPage }, (_, index) => index + 1);

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="surface flex justify-between items-center px-5 py-4 mb-6">
          <Link
            to="/"
            className="text-xl font-bold text-gray-900 hover:text-emerald-600 transition-colors duration-300"
          >
            Storefront
          </Link>
          <span className="text-sm font-medium bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
            Cart: {totalCartItems}
          </span>
        </header>

        <div key={location.pathname} className="fade-up">
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <AddProduct
                    editingProduct={editingProduct}
                    onProductAdded={handleProductSaved}
                    onCancelEdit={() => setEditingProduct(null)}
                  />

                  <div className="surface p-4 mb-6 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="field md:col-span-2"
                      />

                      <select
                        value={selectedCategory}
                        onChange={(e) => {
                          setSelectedCategory(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="field"
                      >
                        <option value="">All Categories</option>
                        <option value="Shoes">Shoes</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Clothing">Clothing</option>
                        <option value="Books">Books</option>
                      </select>

                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Min $"
                          value={minPrice}
                          onChange={(e) => {
                            setMinPrice(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="field w-1/2"
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Max $"
                          value={maxPrice}
                          onChange={(e) => {
                            setMaxPrice(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="field w-1/2"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>
                        Total matching products: <strong>{totalProducts}</strong> (Page{' '}
                        {currentPage} of {lastPage})
                      </span>

                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleClearFilters}
                          className="btn btn-ghost"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="surface p-4 mb-6 text-sm text-red-600 border border-red-200">
                      {error}
                    </div>
                  )}

                  {loading ? (
                    <div className="surface p-8 text-center text-gray-600">
                      Loading products...
                    </div>
                  ) : (
                    <Products
                      products={products}
                      onEdit={(product) => setEditingProduct(product)}
                      onDelete={handleDelete}
                    />
                  )}

                  {lastPage > 1 && (
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        className="btn btn-ghost"
                      >
                        Previous
                      </button>

                      {pageNumbers.map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`btn ${
                            page === currentPage ? 'btn-primary' : 'btn-ghost'
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        type="button"
                        disabled={currentPage >= lastPage}
                        onClick={() =>
                          setCurrentPage((prev) => Math.min(lastPage, prev + 1))
                        }
                        className="btn btn-ghost"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              }
            />

            <Route
              path="/products/:id"
              element={<ProductDetail onAddToCart={handleAddToCart} />}
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;