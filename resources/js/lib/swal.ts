import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
  customClass: {
    popup: 'rounded-2xl shadow-xl border border-blue-50/50 text-sm font-sans',
  },
  buttonsStyling: false,
});

const CustomSwal = Swal.mixin({
  customClass: {
    confirmButton: 'bg-blue-600 text-white font-bold rounded-xl px-6 py-2.5 hover:bg-blue-700 shadow-md transition-colors',
    cancelButton: 'bg-rose-50 text-rose-600 font-bold rounded-xl px-6 py-2.5 hover:bg-rose-100 transition-colors ml-3',
    denyButton: 'bg-amber-50 text-amber-700 font-bold rounded-xl px-6 py-2.5 hover:bg-amber-100 transition-colors',
    popup: 'rounded-[24px] shadow-2xl border border-blue-50/50',
    title: 'text-[#0b1c30] font-extrabold',
    htmlContainer: 'text-[#434654] text-sm mt-2',
    actions: 'mt-6 gap-3',
  },
  buttonsStyling: false,
  reverseButtons: true,
});

export const swalSuccess = (title: string, text?: string) =>
  Toast.fire({ icon: 'success', title, text });

export const swalError = (title: string, text?: string) =>
  CustomSwal.fire({ icon: 'error', title, text });

export const swalWarning = (title: string, text?: string) =>
  CustomSwal.fire({ icon: 'warning', title, text });

export const swalInfo = (title: string, text?: string) =>
  CustomSwal.fire({ icon: 'info', title, text });

export const swalPrompt = async (title: string, inputPlaceholder?: string) => {
  const result = await CustomSwal.fire({
    title,
    input: 'text',
    inputPlaceholder: inputPlaceholder || 'Ketik di sini...',
    showCancelButton: true,
    confirmButtonText: 'Kirim',
    cancelButtonText: 'Batal',
    inputValidator: (value) => {
      if (!value) {
        return 'Wajib diisi!';
      }
      return null;
    }
  });
  return result.isConfirmed ? (result.value as string) : null;
};

export const swalConfirm = (options: {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: 'warning' | 'question' | 'info';
}) =>
  CustomSwal.fire({
    title: options.title,
    text: options.text,
    icon: options.icon || 'warning',
    showCancelButton: true,
    confirmButtonText: options.confirmText || 'Ya, Lanjutkan',
    cancelButtonText: options.cancelText || 'Batal',
  });

export { CustomSwal, Toast };
export default CustomSwal;
