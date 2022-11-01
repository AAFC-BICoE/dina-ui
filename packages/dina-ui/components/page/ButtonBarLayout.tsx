export interface ButtonBarLayoutProps {
  children: React.ReactNode;
}

export default function ButtonBarLayout({ children }) {
  return (
    <>
      <style>
        {`
          .btn-bar {
            position: sticky;
            width: 100%;
            left: 0;
            top: 0;
            min-width: 60px;
            background: #f3f3f3;
            border-bottom: 1px solid #d3d7cf;
            z-index: 900;
            padding: 10px;
          }
        `}
      </style>
      <div className="btn-bar container-fluid px-5 d-flex mb-4">{children}</div>
    </>
  );
}
