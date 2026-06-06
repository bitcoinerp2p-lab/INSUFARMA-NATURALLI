"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  categoryName: string | null;
  createdAt: string;
  author: { name: string };
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/blog`)
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Blog Naturalli</h1>
          <p className="text-gray-500 max-w-xl mx-auto">Dicas de saúde, bem-estar e nutrição para uma vida mais saudável.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <PostSkeleton key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl block mb-4">📝</span>
            <p className="text-gray-500">Nenhum artigo publicado ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <div className="aspect-video bg-gray-50 overflow-hidden">
        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🌿</div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          {post.categoryName && (
            <span className="text-xs font-medium text-brand-red bg-brand-red/10 px-2 py-0.5 rounded-full">{post.categoryName}</span>
          )}
          <span className="text-xs text-gray-400">
            {new Date(post.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        </div>
        <h2 className="font-display font-bold text-gray-900 text-lg leading-snug mb-2 group-hover:text-brand-red transition-colors line-clamp-2">
          {post.title}
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 flex-1">{post.excerpt}</p>
        <p className="text-xs text-gray-400 mt-4">Por {post.author.name}</p>
      </div>
    </Link>
  );
}

function PostSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-100" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="h-5 bg-gray-100 rounded w-4/5" />
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
      </div>
    </div>
  );
}
