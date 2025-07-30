'use client';

import { useParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import Link from "next/link";

export default function StoreQrCode() {
  const { storeId } = useParams();
  const qrRef = useRef<HTMLCanvasElement>(null);

  const defaultUrl = '';
  const [inputUrl, setInputUrl] = useState(defaultUrl);
  const [qrUrl, setQrUrl] = useState(''); // 생성된 QR 코드에 쓸 값, 초기엔 빈 문자열로 숨김

  const handleGenerate = () => {
    if (!inputUrl.trim()) {
      alert('URL을 입력해주세요.');
      return;
    }
    setQrUrl(inputUrl.trim());
  };

  const handleDownload = () => {
    const canvas = qrRef.current;
    if (!canvas) return;

    const imageUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `store-${storeId}-qrcode.png`;
    a.click();
  };

  const clearInput = () => {
    setInputUrl('');
    setQrUrl('');
  };

  return (
    <>
    <div className="mt-4 flex justify-end">
      <Link href={`/store/${storeId}/admin`}>
        <span className="text-sm font-medium text-indigo-600 hover:text-indigo-700 
                        transition flex items-center gap-1">
          ← 매장 운영 관리
        </span>
      </Link>
    </div>

    <div className="p-4 max-w-md mx-auto flex flex-col items-center gap-6">      
      <h2 className="text-2xl font-bold mb-2 text-center">매장 QR 코드 생성</h2>

      {/* input + clear 버튼 감싸는 컨테이너 */}
      <div className="w-full relative">
        <input
          type="text"
          value={inputUrl}
          onChange={e => setInputUrl(e.target.value)}
          placeholder="QR 코드 생성할 URL 입력"
          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-md text-sm text-gray-900
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
        />
        {/* 입력값 있을 때만 지우기 아이콘 보여줌 */}
        {inputUrl && (
          <button
            type="button"
            onClick={clearInput}
            aria-label="입력값 지우기"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      <button
        onClick={handleGenerate}
        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md
                   shadow-md transition-colors duration-200"
      >
        QR 코드 생성
      </button>

      {qrUrl && (
        <>
          <div className="bg-white p-6 rounded-lg shadow-lg flex justify-center">
            <QRCodeCanvas
              value={qrUrl}
              size={220}
              level="H"
              marginSize={4}
              ref={qrRef}
            />
          </div>
          <button
            onClick={handleDownload}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md
                       shadow-md transition-colors duration-200"
          >
            QR 코드 이미지 다운로드
          </button>
        </>
      )}
    </div>
    </>
  );
}
