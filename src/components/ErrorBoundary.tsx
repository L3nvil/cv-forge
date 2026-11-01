import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RotateCcw, Download, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CV Forge ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleEmergencyExport = () => {
    try {
      const raw = localStorage.getItem('cvforge.state.v1');
      const blob = new Blob([raw || '{"error":"No localStorage data"}'], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cvforge_emergency_backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Gagal mengunduh cadangan darurat.');
    }
  };

  private handleReset = () => {
    if (confirm('Apakah Anda yakin ingin mengatur ulang data aplikasi ke data awal?')) {
      try {
        const raw = localStorage.getItem('cvforge.state.v1');
        if (raw) {
          localStorage.setItem(`cvforge:corrupt:${Date.now()}`, raw);
        }
        localStorage.removeItem('cvforge.state.v1');
      } catch {}
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[300px] h-full w-full items-center justify-center p-6 bg-[var(--bg)] text-[var(--text)]">
          <div className="max-w-md w-full rounded-card border border-[var(--border)] bg-[var(--surface)] p-6 shadow-none text-center">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-pill bg-[var(--status-danger-bg)] text-[var(--status-danger)]">
              <AlertCircle size={26} />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text)] mb-2">
              {this.props.fallbackTitle || 'Terjadi Kendala Tampilan'}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mb-6 leading-relaxed">
              Aplikasi mendeteksi error saat memuat antarmuka ini. Data Anda tetap tersimpan dan dapat dicadangkan sebelum memuat ulang.
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={this.handleReload}
                className="btn btn-primary w-full rounded-pill text-xs font-semibold"
              >
                <RefreshCw size={14} />
                <span>Muat Ulang Halaman</span>
              </button>

              <button
                type="button"
                onClick={this.handleEmergencyExport}
                className="btn btn-outline w-full rounded-pill text-xs"
              >
                <Download size={14} />
                <span>Unduh Cadangan Darurat (JSON)</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="btn btn-ghost w-full rounded-pill text-xs text-[var(--status-danger)] hover:bg-[var(--status-danger-bg)]"
              >
                <RotateCcw size={14} />
                <span>Reset ke Data Kosong</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
