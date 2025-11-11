interface GuidelinesProps {
  showGuidelines: boolean;
}

export function CentralIcon() {
  return (
    <svg viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.00255 0.739429L12.1147 6.01823C13.4213 6.77519 13.4499 8.65172 12.1668 9.44808L3.05473 15.1039C1.72243 15.9309 0 14.9727 0 13.4047V2.47C0 0.929093 1.66922 -0.0329925 3.00255 0.739429Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function StarIcon() {
  return (
    <div className="hidden sm:flex absolute justify-center items-center size-[32px] bg-gradient-to-br from-[#99A6B4] to-[#42484E] rounded-full">
      <div className="flex justify-center items-center size-[28px] bg-gray-650 rounded-full overflow-clip">
        <div className="size-3 text-gray-400">
          <svg
            viewBox="0 0 21 21"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9.1806 0.652964C9.50276 -0.217654 10.7342 -0.217655 11.0563 0.652963L13.2 6.44613C13.3013 6.71985 13.5171 6.93566 13.7908 7.03694L19.584 9.1806C20.4546 9.50276 20.4546 10.7342 19.584 11.0563L13.7908 13.2C13.5171 13.3013 13.3013 13.5171 13.2 13.7908L11.0563 19.584C10.7342 20.4546 9.50276 20.4546 9.1806 19.584L7.03694 13.7908C6.93566 13.5171 6.71985 13.3013 6.44613 13.2L0.652964 11.0563C-0.217654 10.7342 -0.217655 9.50276 0.652963 9.1806L6.44613 7.03694C6.71985 6.93566 6.93566 6.71985 7.03694 6.44613L9.1806 0.652964Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function Guidelines({ showGuidelines }: GuidelinesProps) {
  if (!showGuidelines) return null;

  return (
    <>
      {/* 左侧标线 - centralIcon */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 z-30"
        style={{
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="text-gray-400" style={{ width: "16px", height: "16px" }}>
          <CentralIcon />
        </div>
      </div>

      {/* 中间标线 - x 图标 */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-full"
        style={{
          height: "2px",
          backgroundColor: "#34383C",
        }}
      >
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            backgroundColor: "#22272B",
            border: "2px solid #34383C",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 4L10 10M10 4L4 10"
              stroke="#7A8084"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* 右侧标线 - starIcon */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 z-30"
        style={{
          transform: "translate(50%, -50%)",
        }}
      >
        <StarIcon />
      </div>
    </>
  );
}

