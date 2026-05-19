import Link from "next/link";
import Image from "next/image";
import Script from "next/script";

const furnitureImages = [
  {
    src: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800&q=80",
    alt: "Elegant bedroom furniture setup",
    label: "Bedroom Suites",
  },
  {
    src: "https://images.unsplash.com/photo-1567538096621-38d2284b23ff?w=800&q=80",
    alt: "Minimalist modern interior design",
    label: "Minimalist Design",
  },
  {
    src: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
    alt: "Premium velvet couch in modern setting",
    label: "Premium Comfort",
  },
  {
    src: "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=800&q=80",
    alt: "Elegant master bedroom design",
    label: "Master Bedrooms",
  },
  {
    src: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=800&q=80",
    alt: "Luxury dining table with designer chairs",
    label: "Dining Tables",
  },
  {
    src: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    alt: "Elegant formal dining room setup",
    label: "Dining Rooms",
  },
  {
    src: "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80",
    alt: "Luxurious double bed with premium linen",
    label: "Double Beds",
  },
  {
    src: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80",
    alt: "Modern double bed in a styled bedroom",
    label: "King Beds",
  },
  {
    src: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80",
    alt: "Premium divan with soft upholstery",
    label: "Divans",
  },
  {
    src: "https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?w=800&q=80",
    alt: "Chaise lounge divan in a luxury room",
    label: "Chaise Lounges",
  },
];

const officeImages = [
  {
    src: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    alt: "Modern executive office with premium furniture",
    label: "Executive Offices",
  },
  {
    src: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80",
    alt: "Contemporary workspace with ergonomic desk setup",
    label: "Workstations",
  },
  {
    src: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80",
    alt: "Ergonomic office chair in a professional setting",
    label: "Office Chairs",
  },
  {
    src: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80",
    alt: "Modern collaborative open office space",
    label: "Open Workspaces",
  },
  {
    src: "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=800&q=80",
    alt: "Sleek office desk with storage solutions",
    label: "Office Desks",
  },
  {
    src: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80",
    alt: "Professional conference room with premium table",
    label: "Conference Rooms",
  },
];

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    title: "Premium Quality",
    desc: "Every piece crafted with meticulous attention to detail using the finest materials sourced globally.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
    title: "Bespoke Interiors",
    desc: "Tailored furniture solutions designed specifically for your space, taste, and lifestyle needs.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    ),
    title: "White Glove Delivery",
    desc: "Professional installation and setup ensuring your furniture arrives perfectly placed and beautiful.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Lifetime Warranty",
    desc: "Complete peace of mind with our comprehensive warranty covering craftsmanship and all materials.",
  },
];

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-[#06090f] text-white overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-14 py-4 backdrop-blur-xl bg-[#06090f]/70 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-headline">
            LuxuryFurniture
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-white/50 font-medium">
          {[
            { label: "Collections", href: "#collections" },
            { label: "Why Us", href: "#features" },
            { label: "Gallery", href: "#gallery" },
            { label: "Contact Us", href: "#enquiry" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="hover:text-white transition-colors duration-200"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white rounded-lg hover:bg-white/8 transition-all duration-200"
          >
            Log In
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background hero image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1900&q=90"
            alt="Luxury modern living room with premium furniture"
            fill
            className="object-cover object-center scale-105"
            priority
            unoptimized
          />
          {/* Multi-layer overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#06090f] via-[#06090f]/80 to-[#06090f]/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06090f] via-transparent to-[#06090f]/50" />
        </div>

        {/* Ambient glow blobs */}
        <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] rounded-full bg-blue-600/8 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full bg-indigo-600/8 blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-14 pt-28 pb-20 grid md:grid-cols-5 gap-12 items-center">
          {/* Left: text */}
          <div className="md:col-span-3 space-y-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/25 bg-blue-500/10 text-blue-300 text-xs font-semibold tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Premium Furniture · Est. 2010
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.03] tracking-tight font-headline">
              <span className="text-white">Design Your</span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                Dream Space
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/55 leading-relaxed max-w-lg">
              Discover timeless furniture crafted for modern living. Where exceptional
              design meets unmatched comfort — transform every room into a masterpiece.
            </p>

            {/* Stats row */}
            <div className="flex gap-10 pt-4 border-t border-white/8">
              {[
                { value: "12K+", label: "Happy Clients" },
                { value: "850+", label: "Unique Designs" },
                { value: "15 Yrs", label: "of Excellence" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-white font-headline">{stat.value}</div>
                  <div className="text-xs text-white/35 mt-0.5 tracking-wide">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: floating product card */}
          <div className="hidden md:block md:col-span-2">
            <div className="relative ml-auto w-64">
              {/* Main card */}
              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60 bg-[#0d1220]/80 backdrop-blur-md">
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=85"
                    alt="Featured designer chair"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="p-4 space-y-1">
                  <div className="text-[10px] text-blue-400 font-bold tracking-widest uppercase">Featured Pick</div>
                  <div className="font-semibold text-white text-sm">Oslo Lounge Chair</div>
                  <div className="text-white/40 text-xs">Scandinavian Design Series</div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-white font-bold text-base">$2,499</span>
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">In Stock</span>
                  </div>
                </div>
              </div>
              {/* Shadow card */}
              <div className="absolute -bottom-3 -right-3 -z-10 w-full h-full rounded-2xl border border-white/5 bg-white/[0.01]" />
              {/* Second shadow card */}
              <div className="absolute -bottom-6 -right-6 -z-20 w-full h-full rounded-2xl border border-white/[0.03] bg-transparent" />
            </div>
          </div>
        </div>

        {/* Bottom scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/25 text-xs">
          <span className="tracking-widest uppercase text-[10px]">Scroll to explore</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </section>

      {/* ── MARQUEE STRIP ── */}
      <div className="border-y border-white/[0.06] bg-white/[0.02] py-4 overflow-hidden">
        <div className="flex gap-12 whitespace-nowrap animate-marquee" style={{ width: "max-content" }}>
          {[...Array(3)].map((_, idx) =>
            ["Premium Materials", "Timeless Design", "Handcrafted Quality", "Free Delivery", "Lifetime Warranty", "Expert Installation", "Custom Orders"].map((tag) => (
              <span key={`${tag}-${idx}`} className="inline-flex items-center gap-3 text-sm text-white/30 font-medium">
                <span className="w-1 h-1 rounded-full bg-blue-500/60" />
                {tag}
              </span>
            ))
          )}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="features" className="py-28 px-6 md:px-14 max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <p className="text-blue-400 text-xs font-bold tracking-[0.25em] uppercase">Why Choose Us</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white font-headline">
            Crafted for{" "}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Excellence
            </span>
          </h2>
          <p className="text-white/45 max-w-xl mx-auto leading-relaxed text-base">
            From concept to creation, every piece reflects our unwavering commitment to quality and design.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="group p-7 rounded-2xl border border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.05] hover:border-blue-500/25 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-500/5"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-500/15 border border-blue-500/15 flex items-center justify-center text-blue-400 mb-5 group-hover:border-blue-400/30 group-hover:shadow-lg group-hover:shadow-blue-500/10 transition-all">
                {f.icon}
              </div>
              <h3 className="text-white font-semibold mb-2 font-headline">{f.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── GALLERY ── */}
      <section id="gallery" className="py-16 px-6 md:px-14 max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <p className="text-blue-400 text-xs font-bold tracking-[0.25em] uppercase">Our Collections</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white font-headline">
            Stunning{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Spaces
            </span>
          </h2>
          <p className="text-white/45 max-w-md mx-auto text-base leading-relaxed">
            Hand-picked designs that redefine the way you live, relax, and entertain.
          </p>
        </div>

        {/* Masonry-style grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {furnitureImages.map((img, i) => (
            <div
              key={i}
              className={`group relative overflow-hidden rounded-2xl border border-white/[0.07] hover:border-blue-500/25 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/40 cursor-pointer ${i === 0 ? "lg:row-span-2" : ""}`}
            >
              <div className={`relative overflow-hidden ${i === 0 ? "h-72 lg:h-full lg:min-h-[520px]" : "h-60"}`}>
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover object-center group-hover:scale-[1.06] transition-transform duration-700 ease-out"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06090f]/90 via-[#06090f]/20 to-transparent" />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                  <span className="block text-xs font-bold text-white/40 tracking-widest uppercase mb-1">{img.label}</span>
                  <div className="w-0 group-hover:w-8 h-0.5 bg-blue-400 rounded-full transition-all duration-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── OFFICE FURNITURE ── */}
      <section id="office" className="py-16 px-6 md:px-14 max-w-7xl mx-auto">
        {/* Header + description */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14">
          <div className="space-y-4 max-w-2xl">
            <p className="text-blue-400 text-xs font-bold tracking-[0.25em] uppercase">Office Collections</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white font-headline">
              Elevate Your{" "}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Workspace
              </span>
            </h2>
            <p className="text-white/50 text-base leading-relaxed">
              A great workspace starts with the right furniture. Our office collection blends
              ergonomic precision with sleek, professional aesthetics — designed to boost
              productivity and make a lasting impression on every client and colleague.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end lg:gap-2">
            {[
              "Ergonomic Design",
              "Custom Configurations",
              "Bulk Orders Welcome",
              "Corporate Pricing",
            ].map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/8 text-blue-300 text-xs font-medium"
              >
                <span className="w-1 h-1 rounded-full bg-blue-400" />
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Office highlights row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            {
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
                </svg>
              ),
              title: "Executive Desks & Suites",
              desc: "Command your space with solid-wood executive desks, credenzas, and full office suite sets built for leaders.",
            },
            {
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              ),
              title: "Ergonomic Chairs",
              desc: "Hours of comfort with lumbar-support seating — mesh, leather, and fabric finishes tailored to your role.",
            },
            {
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              ),
              title: "Conference & Collaboration",
              desc: "Impress in every meeting with premium conference tables, boardroom chairs, and modular lounge pods.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="group p-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.05] hover:border-blue-500/25 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-500/15 border border-blue-500/15 flex items-center justify-center text-blue-400 mb-4">
                {item.icon}
              </div>
              <h3 className="text-white font-semibold mb-2 font-headline text-sm">{item.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Office gallery grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {officeImages.map((img, i) => (
            <div
              key={i}
              className={`group relative overflow-hidden rounded-2xl border border-white/[0.07] hover:border-blue-500/25 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/40 cursor-pointer ${i === 0 ? "lg:row-span-2" : ""}`}
            >
              <div className={`relative overflow-hidden ${i === 0 ? "h-64 lg:h-full lg:min-h-[500px]" : "h-56"}`}>
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover object-center group-hover:scale-[1.06] transition-transform duration-700 ease-out"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06090f]/90 via-[#06090f]/20 to-transparent" />
                <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                  <span className="block text-xs font-bold text-white/40 tracking-widest uppercase mb-1">{img.label}</span>
                  <div className="w-0 group-hover:w-8 h-0.5 bg-blue-400 rounded-full transition-all duration-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-16 px-6 md:px-14 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden border border-blue-500/15 shadow-2xl shadow-blue-900/20">
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=1400&q=85"
              alt="Luxury home interior"
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-[#06090f]/75" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#06090f]/98 via-[#06090f]/90 to-[#06090f]/70" />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-700/20 to-transparent" />
          </div>
          <div className="relative z-10 px-8 md:px-16 py-16 text-center md:text-left">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-white font-headline leading-snug">
                Ready to Transform <br className="hidden md:block" />Your Home?
              </h2>
              <p className="text-white/50 max-w-md leading-relaxed">
                Join thousands of homeowners who have elevated their living spaces
                with LuxuryFurniture's premium collections.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── ENQUIRY FORM ── */}
      <section id="enquiry" className="py-20 px-6 md:px-14 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400 mb-3">Get In Touch</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white font-headline leading-snug">
            Furniture Enquiry
          </h2>
          <p className="text-white/40 mt-3 max-w-md mx-auto text-sm leading-relaxed">
            Tell us about your space and we'll help you find the perfect pieces from our premium collections.
          </p>
        </div>
        <div className="max-w-2xl mx-auto rounded-2xl overflow-hidden border border-white/[0.06] shadow-xl shadow-black/30 bg-white/[0.02]">
          <iframe
            src="https://api.leadconnectorhq.com/widget/form/ob1aRlo4HBVHY8oExYV2"
            style={{ width: "100%", height: "824px", border: "none", borderRadius: "8px", filter: "saturate(0.55) brightness(0.92) contrast(0.93)" }}
            id="inline-ob1aRlo4HBVHY8oExYV2"
            data-layout='{"id":"INLINE"}'
            data-trigger-type="alwaysShow"
            data-trigger-value=""
            data-activation-type="alwaysActivated"
            data-activation-value=""
            data-deactivation-type="neverDeactivate"
            data-deactivation-value=""
            data-form-name="Furniture-Enquiry-Form"
            data-height="824"
            data-layout-iframe-id="inline-ob1aRlo4HBVHY8oExYV2"
            data-form-id="ob1aRlo4HBVHY8oExYV2"
            title="Furniture-Enquiry-Form"
          />
        </div>
        <Script src="https://link.msgsndr.com/js/form_embed.js" strategy="lazyOnload" />
      </section>

      {/* ── WEBCHAT WIDGET ── */}
      <Script
        src="https://widgets.leadconnectorhq.com/loader.js"
        data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
        data-widget-id="6a01ef3b205bf897ae837633"
        strategy="lazyOnload"
      />

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.06] py-10 px-6 md:px-14 mt-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-white/30 text-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
              </svg>
            </div>
            <span className="font-semibold text-white/50">LuxuryFurniture</span>
          </div>
          <p>© 2026 LuxuryFurniture. All rights reserved.</p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Contact"].map((item) => (
              <Link key={item} href="#" className="hover:text-white/60 transition-colors">
                {item}
              </Link>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}
