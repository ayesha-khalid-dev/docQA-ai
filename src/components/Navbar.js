"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Show,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home" },
    { href: "/upload", label: "Upload" },
    { href: "/chat", label: "Chat" },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#9FDFC0]/90 border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="max-w-6xl mx-auto flex flex-col gap-3 md:grid md:grid-cols-3 md:items-center md:gap-0">
        {/* Mobile: logo + login in one row */}
        <div className="flex items-center justify-between md:contents">
          <Link href="/" className="text-xl font-extrabold text-gray-900 flex items-center gap-1.5 justify-self-start">
            <span className="icon-bob inline-block">📄</span>
            Doc<span className="text-[#065F46]">QA</span>
          </Link>

          <div className="md:hidden">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="btn-3d bg-gradient-to-r from-[#10B981] to-[#0EA5A6] text-white text-sm font-semibold px-4 py-1.5 rounded-full hover:from-[#059669] hover:to-[#0891A6] transition">
                  Login
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <UserButton afterSignOutUrl="/" />
            </Show>
          </div>
        </div>

        {/* Links - center */}
        <div className="flex gap-6 md:gap-8 justify-center md:justify-self-center">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative text-sm md:text-base font-bold transition py-1 group ${
                pathname === link.href
                  ? "text-[#065F46]"
                  : "text-gray-900 hover:text-black"
              }`}
            >
              {link.label}
              <span
                className={`absolute left-0 -bottom-0.5 h-0.5 bg-[#10B981] transition-all duration-300 ${
                  pathname === link.href ? "w-full" : "w-0 group-hover:w-full"
                }`}
              ></span>
            </Link>
          ))}
        </div>

        {/* Login button - desktop only, right */}
        <div className="hidden md:block justify-self-end">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="btn-3d bg-gradient-to-r from-[#10B981] to-[#0EA5A6] text-white text-sm font-semibold px-5 py-2 rounded-full hover:from-[#059669] hover:to-[#0891A6] transition">
                Login
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <UserButton afterSignOutUrl="/" />
          </Show>
        </div>
      </div>
    </nav>
  );
}