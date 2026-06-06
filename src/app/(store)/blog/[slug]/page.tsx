"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string | null;
  categoryName: string | null;
  createdAt: string;
  updatedAt: string;
  author: { name: string };
}

export default function BlogPostPage() {
  const { slug } = useParams() as { slug: string };
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`${BASE}/api/blog/${slug}`)
      .then((r) => r.json())
      .then((d) => setPost(d.post ?? null))
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Skeleton />;
  if (!post) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <span className="text-5xl">😕</span>
        <h1 className="text-xl font-bold text-gray-900">Artigo não encontrado</h1>
        <Link href="/blog" className="btn-primary">Ver todos os artigos</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-3xl">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-brand-red">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-brand-red">Blog</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate max-w-[200px]">{post.title}</span>
        </nav>

        <article className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {post.coverImage && (
            <div className="aspect-video bg-gray-50 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-6 sm:p-10">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {post.categoryName && (
                <span className="text-xs font-medium text-brand-red bg-brand-red/10 px-2.5 py-1 rounded-full">
                  {post.categoryName}
                </span>
              )}
              <span className="text-sm text-gray-400">
                {new Date(post.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 leading-snug mb-4">
              {post.title}
            </h1>

            <p className="text-gray-600 text-base leading-relaxed mb-6 border-l-4 border-brand-gold pl-4 italic">
              {post.excerpt}
            </p>

            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
              {post.content.split("\n").map((line, i) =>
                line.trim() === "" ? <br key={i} /> : <p key={i} className="mb-3">{line}</p>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3 text-sm text-gray-500">
              <p>Por <span className="font-medium text-gray-700">{post.author.name}</span></p>
              <p>Atualizado em {new Date(post.updatedAt).toLocaleDateString("pt-BR")}</p>
            </div>
          </div>
        </article>

        <div className="mt-6 text-center">
          <Link href="/blog" className="text-sm text-brand-red hover:underline">← Ver todos os artigos</Link>
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl animate-pulse">
      <div className="h-4 bg-gray-100 rounded w-1/3 mb-6" />
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="aspect-video bg-gray-100" />
        <div className="p-10 space-y-4">
          <div className="h-3 bg-gray-100 rounded w-1/4" />
          <div className="h-8 bg-gray-100 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}
