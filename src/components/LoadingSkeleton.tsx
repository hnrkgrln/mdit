import React from 'react';

interface LoadingSkeletonProps {
  type?: 'editor' | 'header' | 'file-browser' | 'text';
  lines?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Loading skeleton component for various parts of the UI
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = 'text',
  lines = 1,
  className,
  style,
}) => {
  const baseStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, var(--border-color) 25%, transparent 25%, transparent 50%, var(--border-color) 50%, var(--border-color) 75%, transparent 75%)',
    backgroundSize: '40px 40px',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '4px',
    ...style,
  };

  const shimmerStyle = document.createElement('style');
  shimmerStyle.textContent = `
    @keyframes shimmer {
      0% { background-position: -40px 0; }
      100% { background-position: calc(100% + 40px) 0; }
    }
  `;

  switch (type) {
    case 'editor':
      return (
        <div
          className={className}
          style={{
            ...baseStyle,
            width: '100%',
            height: '100%',
            minHeight: '400px',
          }}
        />
      );

    case 'header':
      return (
        <div
          className={className}
          style={{
            ...baseStyle,
            width: '100%',
            height: '50px',
          }}
        />
      );

    case 'file-browser':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={className}
              style={{
                ...baseStyle,
                width: '100%',
                height: '40px',
              }}
            />
          ))}
        </div>
      );

    case 'text':
    default:
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={className}
              style={{
                ...baseStyle,
                width: i === 0 ? '80%' : i === lines - 1 ? '60%' : '100%',
                height: '20px',
              }}
            />
          ))}
        </div>
      );
  }
};

// Convenience component for full-page loading
interface FullPageLoadingProps {
  message?: string;
}

export const FullPageLoading: React.FC<FullPageLoadingProps> = ({
  message = 'Loading MDit...',
}) => (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-color)',
      zIndex: 9999,
    }}
  >
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      <LoadingSkeleton
        type="editor"
        style={{
          width: '200px',
          height: '40px',
        }}
      />
      <span style={{ color: 'var(--gb-gray)', fontSize: '14px' }}>
        {message}
      </span>
    </div>
  </div>
);
