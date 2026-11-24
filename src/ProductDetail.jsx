import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_ORIGIN = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
const API_BASE = `${API_ORIGIN}/api`;

const FALLBACK_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="#f3f4f6"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b7280" font-family="sans-serif" font-size="20">No Image Available</text>
  </svg>`
)}`;

function resolveImageUrl(image) {
  if (!image) return FALLBACK_IMAGE;
  if (/^(https?:\/\/|data:|blob:)/i.test(image)) return image;
  const cleanPath = image.replace(/^\/+/, '');
  if (cleanPath.startsWith('storage/')) {
    return `http://127.0.0.1:8000/${cleanPath}`;
  }
  return `http://127.0.0.1:8000/storage/${cleanPath}`;
}

const ProductDetail = ({ onAddToCart }) => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addedMessage, setAddedMessage] = useState('');
  const [imgSrc, setImgSrc] = useState(FALLBACK_IMAGE);

  useEffect(() => {
    const controller = new AbortController();

    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      setAddedMessage('');
      setProduct(null);

      try {
        const res = await fetch(`${API_BASE}/products/${id}`, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(
            res.status === 404 ? 'Product not found' : 'Failed to load product details'
          );
        }

        const raw = await res.json();
        const item = raw?.data ?? raw?.product ?? raw;

        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          throw new Error('Product not found');
        }

        setProduct(item);
        setImgSrc(resolveImageUrl(item.image));
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Failed to load product details');
        setProduct(null);
        setImgSrc(FALLBACK_IMAGE);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProduct();
    return () => controller.abort();
  }, [id]);

  const handleAddClick = () => {
    if (!product) return;
    onAddToCart?.(product);
    setAddedMessage('Added to cart!');
  };

  if (loading) {
    return (
      <div className="surface max-w-3xl mx-auto mt-10 p-6 text-center text-gray-600">
        Loading product details...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="surface max-w-3xl mx-auto mt-10 p-6 text-center">
        <p className="text-red-600 font-semibold mb-4">
          {error || 'Product not found'}
        </p>
        <Link
          to="/"
          className="text-emerald-600 hover:text-emerald-700 transition-colors duration-300"
        >
          ← Back to Products
        </Link>
      </div>
    );
  }

  const displayName = product.title || product.name || 'Untitled Product';
  const numericPrice = Number(product.price);
  const formattedPrice = Number.isFinite(numericPrice)
    ? numericPrice.toFixed(2)
    : '0.00';

  return (
    <div className="surface max-w-3xl mx-auto mt-8 p-6">
      <div className="mb-4">
        <Link
          to="/"
          className="text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors duration-300"
        >
          ← Back to Products
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="card overflow-hidden rounded-xl">
          <img
            src={imgSrc}
            alt={displayName}
            onError={() => setImgSrc(FALLBACK_IMAGE)}
            className="w-full h-72 object-cover"
          />
        </div>

        <div>
          <span className="inline-block text-xs font-medium uppercase tracking-wide bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full mb-2">
            {product.category || 'General'}
          </span>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{displayName}</h1>

          <p className="text-2xl font-bold text-emerald-600 mb-4">
            ${formattedPrice}
          </p>

          <p className="text-gray-700 leading-relaxed mb-6">
            {product.description || 'No description available for this product.'}
          </p>

          <button
            type="button"
            onClick={handleAddClick}
            className="btn btn-primary"
          >
            Add to Cart
          </button>

          {addedMessage && (
            <p className="fade-up text-emerald-600 text-sm font-medium mt-3">
              {addedMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;