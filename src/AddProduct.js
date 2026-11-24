import React, { useState, useEffect, useRef } from 'react';

const API_ORIGIN = 'http://127.0.0.1:8000';
const API_BASE = `${API_ORIGIN}/api`;
const CATEGORIES = ['Shoes', 'Electronics', 'Clothing', 'Books'];

function resolveImageUrl(image) {
  if (!image || typeof image !== 'string') return '';
  if (/^(https?:\/\/|data:|blob:)/i.test(image)) return image;
  const cleanPath = image.replace(/^\/+/, '');
  return cleanPath.startsWith('storage/')
    ? `${API_ORIGIN}/${cleanPath}`
    : `${API_ORIGIN}/storage/${cleanPath}`;
}

const AddProduct = ({ editingProduct, onProductAdded, onCancelEdit }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [removeImage, setRemoveImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (editingProduct) {
      setTitle(editingProduct.title || editingProduct.name || '');
      setCategory(editingProduct.category || '');
      setDescription(editingProduct.description || '');
      setPrice(
        editingProduct.price !== undefined && editingProduct.price !== null
          ? String(editingProduct.price)
          : ''
      );
      const existingImg = editingProduct.image || '';
      setImageUrl(/^https?:\/\//i.test(existingImg) ? existingImg : '');
      setImageFile(null);
      setPreviewUrl(resolveImageUrl(existingImg));
      setRemoveImage(false);
      setError('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      resetForm();
    }
  }, [editingProduct]);

  useEffect(() => {
    if (!imageFile) return;
    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const resetForm = () => {
    setTitle('');
    setCategory('');
    setDescription('');
    setPrice('');
    setImageUrl('');
    setImageFile(null);
    setPreviewUrl('');
    setRemoveImage(false);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      setImageUrl('');
      setRemoveImage(false);
    }
  };

  const handleUrlChange = (e) => {
    const val = e.target.value;
    setImageUrl(val);
    if (val.trim()) {
      setImageFile(null);
      setPreviewUrl(val.trim());
      setRemoveImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else if (!imageFile) {
      setPreviewUrl('');
    }
  };

  const handleClearImage = () => {
    setImageFile(null);
    setImageUrl('');
    setPreviewUrl('');
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedTitle = title.trim();
    const numericPrice = Number(price);

    if (!trimmedTitle) {
      setError('Please enter a product title.');
      return;
    }

    if (price === '' || !Number.isFinite(numericPrice) || numericPrice < 0) {
      setError('Please enter a valid non-negative price.');
      return;
    }

    setSubmitting(true);

    const isEditing = Boolean(editingProduct?.id);
    const url = isEditing
      ? `${API_BASE}/products/${editingProduct.id}`
      : `${API_BASE}/products`;

    const formData = new FormData();
    formData.append('title', trimmedTitle);
    if (category) formData.append('category', category);
    formData.append('description', description.trim());
    formData.append('price', String(numericPrice));

    if (imageFile) {
      formData.append('image_file', imageFile);
    } else if (imageUrl.trim()) {
      formData.append('image', imageUrl.trim());
    } else if (isEditing && removeImage) {
      formData.append('remove_image', '1');
    }

    if (isEditing) {
      formData.append('_method', 'PUT');
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const firstValidationError = data?.errors
          ? Object.values(data.errors).flat()[0]
          : null;
        throw new Error(
          firstValidationError ||
            data?.message ||
            (isEditing ? 'Failed to update product' : 'Failed to add product')
        );
      }

      if (!isEditing) {
        resetForm();
      }

      onProductAdded?.(data);
    } catch (err) {
      console.error('Submit product error:', err);
      setError(err.message || 'Error saving product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="surface p-6 mb-6 max-w-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </h2>
        {editingProduct && (
          <button
            type="button"
            onClick={() => onCancelEdit?.()}
            className="btn btn-ghost text-sm"
          >
            Cancel
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <input
        type="text"
        placeholder="Title"
        className="field mb-3"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <select
        className="field mb-3"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="">Select Category (Optional)</option>
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      <textarea
        placeholder="Description"
        rows="3"
        className="field mb-3 resize-none"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <input
        type="number"
        min="0"
        step="0.01"
        placeholder="Price"
        className="field mb-3"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
      />

      {/* Image Upload & URL Input */}
      <div className="mb-4 space-y-2 rounded-xl border border-gray-200/80 bg-white/60 p-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
          Product Image (Upload or URL)
        </label>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
        />

        <input
          type="url"
          placeholder="Or paste an image URL (https://...)"
          className="field text-sm"
          value={imageUrl}
          onChange={handleUrlChange}
        />

        {previewUrl && (
          <div className="relative mt-2 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
            <img
              src={previewUrl}
              alt="Preview"
              onError={() => setPreviewUrl('')}
              className="h-40 w-full object-cover"
            />
            <button
              type="button"
              onClick={handleClearImage}
              className="btn btn-danger absolute top-2 right-2 text-xs px-2.5 py-1"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      <button type="submit" disabled={submitting} className="btn btn-primary">
        {submitting
          ? editingProduct
            ? 'Updating...'
            : 'Adding...'
          : editingProduct
            ? 'Update Product'
            : 'Add Product'}
      </button>
    </form>
  );
};

export default AddProduct;