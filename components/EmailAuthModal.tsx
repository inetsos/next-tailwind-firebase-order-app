'use client';

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { Fragment } from 'react';
import EmailAuth from './EmailAuth';
import { useRouter } from 'next/navigation';

interface EmailAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void; // optional
  redirectTo?: string; // 로그인 후 이동할 경로
}

export default function EmailAuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  redirectTo,
}: EmailAuthModalProps) {
  const router = useRouter();

  const handleLoginSuccess = () => {
    // 모달 닫기
    onClose();

    // 외부 callback이 있으면 호출
    if (onLoginSuccess) {
      onLoginSuccess();
    }

    // redirectTo가 있으면 이동
    if (redirectTo) {
      router.replace(redirectTo);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* 배경 */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </TransitionChild>

        {/* 모달 */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-md rounded bg-white p-6 shadow-xl">
              {/* <DialogTitle className="text-lg font-semibold text-gray-900 mb-2">
                이메일 로그인
              </DialogTitle> */}

              <EmailAuth onLoginSuccess={handleLoginSuccess} />
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
