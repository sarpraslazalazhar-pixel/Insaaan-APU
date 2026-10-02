import React, { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { Sidebar } from '../Components/Shared/Sidebar';
import { Header } from '../Components/Shared/Header';
import { UIProvider } from '../lib/UIContext';
import { swalSuccess, swalError } from '../lib/swal';

interface Props {
  children: React.ReactNode;
  title: string;
}

const LayoutContent: React.FC<Props> = ({ children, title }) => {
  const { flash } = usePage().props as any;

  useEffect(() => {
    if (flash?.success) {
      swalSuccess('Berhasil', flash.success);
    }
    if (flash?.error) {
      swalError('Gagal', flash.error);
    }
  }, [flash]);

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] relative lg:pl-[260px] pt-[80px]">
      <Sidebar />
      <Header title={title} />
      <main className="p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
};

export const AppLayout: React.FC<Props> = (props) => {
  return (
    <UIProvider>
      <LayoutContent {...props} />
    </UIProvider>
  );
};

export default AppLayout;
