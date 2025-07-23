"use client";
import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

function Comment({ comment }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <p className="font-semibold text-gray-800">{comment.userName}</p>
      <p className="text-gray-700">{comment.text}</p>
      <button
        onClick={() => setShowReplyForm(!showReplyForm)}
        className="text-sm text-blue-500 mt-1 hover:underline"
      >
        Balas
      </button>
      {/* Memastikan topicId di-pass ke form balasan */}
      {showReplyForm && (
        <CommentForm
          topicId={comment.topicId}
          parentId={comment.id}
          onCommentPosted={() => setShowReplyForm(false)}
        />
      )}
      <div className="pl-6 border-l-2 border-gray-200">
        {comment.replies?.map((reply) => (
          <Comment key={reply.id} comment={reply} />
        ))}
      </div>
    </div>
  );
}

function CommentForm({ topicId, parentId = null, onCommentPosted }) {
  const { user } = useAuth();
  const [text, setText] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || !user || !topicId) return;

    await addDoc(collection(db, "comments"), {
      topicId,
      parentId,
      text,
      userId: user.uid,
      userName: user.displayName,
      createdAt: serverTimestamp(),
    });

    setText("");
    if (onCommentPosted) onCommentPosted();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-2 border rounded-md text-gray-900"
        placeholder={parentId ? "Tulis balasan..." : "Tulis komentar..."}
        rows="2"
      ></textarea>
      <button
        type="submit"
        className="px-4 py-2 mt-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        Kirim
      </button>
    </form>
  );
}

export default function Comments({ topicId, title }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (!topicId) return;
    const q = query(
      collection(db, "comments"),
      where("topicId", "==", topicId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        topicId,
      }));

      const commentMap = {};
      fetchedComments.forEach(
        (comment) => (commentMap[comment.id] = { ...comment, replies: [] })
      );

      const hierarchicalComments = [];
      fetchedComments.forEach((comment) => {
        if (comment.parentId) {
          commentMap[comment.parentId]?.replies.push(commentMap[comment.id]);
        } else {
          hierarchicalComments.push(commentMap[comment.id]);
        }
      });

      setComments(hierarchicalComments);
    });

    return () => unsubscribe();
  }, [topicId]);

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-bold text-gray-600">{title || "Diskusi"}</h3>
      {user ? (
        <>
          <CommentForm topicId={topicId} />
          <div className="mt-6">
            {comments.map((comment) => (
              <Comment key={comment.id} comment={comment} />
            ))}
            {comments.length === 0 && (
              <p className="text-gray-500 mt-4">
                Jadilah yang pertama berkomentar!
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="mt-4 p-4 bg-gray-100 rounded-md">
          <Link href="/login" className="text-blue-600 font-semibold">
            Login
          </Link>{" "}
          untuk berpartisipasi dalam diskusi.
        </p>
      )}
    </div>
  );
}
