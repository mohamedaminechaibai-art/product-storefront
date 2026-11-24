import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const API_ORIGIN = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';


function resolveImageUrl(image) {
  if (!image || typeof image !== 'string') return '';
  if (/^(https?:\/\/|data:|blob:)/i.test(image)) return image;
  const cleanPath = image.replace(/^\/+/, '');
  return cleanPath.startsWith('storage/')
    ? `${API_ORIGIN}/${cleanPath}`
    : `${API_ORIGIN}/storage/${cleanPath}`;
}

const ProductCard = ({ product, index, onEdit, onDelete }) => {
  const [imgFailed, setImgFailed] = useState(false);

  const title = product.title || product.name || 'Untitled Product';
  const category = product.category || 'General';
  const imageUrl = !imgFailed ? resolveImageUrl(product.image) : '';
  const numericPrice = Number(product.price);
  const formattedPrice = Number.isFinite(numericPrice)
    ? numericPrice.toFixed(2)
    : '0.00';

  return (
    <article
      style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
      className="surface card fade-up p-4 flex flex-col justify-between rounded-2xl border border-white/80"
    >
      <div>
        <Link
          to={`/products/${product.id}`}
          aria-label={`View details for ${title}`}
          className="block group"
        >
          {imageUrl && (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100/90 mb-4 border border-gray-200/60">
              <img
                src={imageUrl}
                alt={title}
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 border border-emerald-200/70">
              {category}
            </span>
            <span className="text-xs font-medium text-gray-400 group-hover:text-emerald-600 transition-colors">
              Details →
            </span>
          </div>

          <h3 className="text-lg font-semibold leading-snug text-gray-900 group-hover:text-emerald-600 transition-colors duration-200 line-clamp-1">
            {title}
          </h3>

          <p className="text-sm text-gray-600 leading-relaxed mt-1.5 line-clamp-2 min-h-[2.625rem]">
            {product.description || 'No description provided for this item.'}
          </p>
        </Link>

        <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-wider font-medium text-gray-400">
            Price
          </span>
          <span className="text-xl font-bold tracking-tight text-emerald-600">
            ${formattedPrice}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3.5 border-t border-gray-200/70 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onEdit?.(product)}
          className="btn btn-ghost flex-1 text-center"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() => onDelete?.(product.id)}
          className="btn btn-danger flex-1 text-center"
        >
          Delete
        </button>
      </div>
    </article>
  );
};

const Products = ({ products = [], onEdit, onDelete }) => {
  const list = Array.isArray(products) ? products : [];

  return (
    <section className="mt-6" aria-label="Product List">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Product List
        </h2>
        {list.length > 0 && (
          <span className="text-xs font-medium text-gray-500">
            Showing {list.length} {list.length === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {list.length === 0 ? (
        <div className="surface p-8 text-center rounded-2xl">
          <p className="text-gray-600 font-medium">No products found.</p>
          <p className="text-xs text-gray-400 mt-1">
            Try adjusting your search or category filters, or add a new product above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((product, index) => (
            <ProductCard
              key={product.id ?? index}
              product={product}
              index={index}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default Products;