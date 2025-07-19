// components/Footer.tsx
export default function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-600 text-sm text-center py-4  print:hidden">
      © {new Date().getFullYear()} 시지 라이프. All rights reserved.
    </footer>
  )
}
