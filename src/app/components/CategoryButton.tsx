import { Link } from 'react-router';

interface CategoryButtonProps {
  type: 'travels' | 'transportation' | 'eats' | 'attractions';
  isActive?: boolean;
  onClick?: () => void;
}

const categoryPaths: Record<CategoryButtonProps['type'], string> = {
  travels: '/travels',
  transportation: '/transportation',
  eats: '/eats-and-drinks',
  attractions: '/attractions',
};

const categoryConfig = {
  travels: {
    text: 'TRAVELS',
    icon: (isActive: boolean) => (
      <g transform="translate(-122.07, -53.18)">
        <path className={`fill-none stroke-[1.58px] stroke-linecap-round stroke-linejoin-round transition-colors ${isActive ? 'stroke-[#FDB913]' : 'stroke-white group-hover:stroke-[#FDB913]'}`} d="M170.53,69.41c1.35.94-.05,4-1.36,5.82s-7.37,6.76-7.37,6.76l4.29,19.04-1.82,1.85-8.28-15.65-8.33,7.92,1.46,6.91-1.06.81-3.99-6.46"/>
        <path className={`fill-none stroke-[1.58px] stroke-linecap-round stroke-linejoin-round transition-colors ${isActive ? 'stroke-[#FDB913]' : 'stroke-white group-hover:stroke-[#FDB913]'}`} d="M170.87,69.76c-.94-1.35-4,.05-5.82,1.36s-6.76,7.37-6.76,7.37l-19.04-4.29-1.85,1.82,15.65,8.28-7.92,8.33-6.91-1.46-.81,1.06,6.46,3.99"/>
      </g>
    )
  },
  transportation: {
    text: 'TRANSPORTATION',
    icon: (isActive: boolean) => (
      <g transform="translate(-339.38, -53.15)">
        <path className={`fill-none stroke-[1.62px] stroke-linecap-round stroke-linejoin-round transition-colors ${isActive ? 'stroke-[#FDB913]' : 'stroke-white group-hover:stroke-[#FDB913]'}`} d="M358.22,80.37l-2.38,3.89c-.46.75-.66,1.61-.56,2.47l.95,8.15h16.14"/>
        <path className={`fill-none stroke-[1.62px] stroke-linecap-round stroke-linejoin-round transition-colors ${isActive ? 'stroke-[#FDB913]' : 'stroke-white group-hover:stroke-[#FDB913]'}`} d="M358.22,80.37s-1.01-.87-2.55-1.09c-1.54-.22-2.6-.06-2.79.53-.23.72-1.26,2.3,1.33,2.38"/>
        <path className={`fill-none stroke-[1.62px] stroke-linecap-round stroke-linejoin-round transition-colors ${isActive ? 'stroke-[#FDB913]' : 'stroke-white group-hover:stroke-[#FDB913]'}`} d="M372.72,74.31s-8.93-.12-10.73.74c-1.58.75-3.35,4.42-3.77,5.32"/>
        <path className={`fill-none stroke-[1.62px] stroke-linecap-round stroke-linejoin-round transition-colors ${isActive ? 'stroke-[#FDB913]' : 'stroke-white group-hover:stroke-[#FDB913]'}`} d="M366.43,88.28s-2.2-.12-5.19-.23c-2.99-.12-2.42-2.03-2.42-2.03"/>
        <path className={`fill-none stroke-[1.62px] stroke-linecap-round stroke-linejoin-round transition-colors ${isActive ? 'stroke-[#FDB913]' : 'stroke-white group-hover:stroke-[#FDB913]'}`} d="M366.43,91.52h12.58"/>
        <path className={`fill-none stroke-[1.62px] stroke-linecap-round stroke-linejoin-round transition-colors ${isActive ? 'stroke-[#FDB913]' : 'stroke-white group-hover:stroke-[#FDB913]'}`} d="M358.13,80.52s.56.89,2.58.89h11.9"/>
        <path className={`fill-none stroke-[1.62px] stroke-linecap-round stroke-linejoin-round transition-colors ${isActive ? 'stroke-[#FDB913]' : 'stroke-white group-hover:stroke-[#FDB913]'}`} d="M360.84,94.88h0c1.56,0,2.82,1.27,2.82,2.82v.3h-5.65v-.3c0-1.56,1.27-2.82,2.82-2.82Z" transform="translate(721.69 192.88) rotate(180)"/>
        <path className={`fill-none stroke-[1.62px] stroke-linecap-round stroke-linejoin-round transition-colors ${isActive ? 'stroke-[#FDB913]' : 'stroke-white group-hover:stroke-[#FDB913]'}`} d="M386.54,80.37l2.38,3.89c.46.75.66,1.61.56,2.47l-.95,8.15h-16.14"/>
        <path className={`fill-none stroke-[1.62px] stroke-linecap-round stroke-linejoin-round transition-colors ${isActive ? 'stroke-[#FDB913]' : 'stroke-white group-hover:stroke-[#FDB913]'}`} d="M386.54,80.37s1.01-.87,2.55-1.09c1.54-.22,2.6-.06,2.79.53.23.72,1.26,2.3-1.33,2.38"/>
        <path className={`fill-none stroke-[1.62px] stroke-linecap-round stroke-linejoin-round transition-colors ${isActive ? 'stroke-[#FDB913]' : 'stroke-white group-hover:stroke-[#FDB913]'}`} d="M372.04,74.31s8.93-.12,10.73.74c1.58.75,3.35,4.42,3.77,5.32"/>
        <path className={`fill-none stroke-[1.62px] stroke-linecap-round stroke-linejoin-round transition-colors ${isActive ? 'stroke-[#FDB913]' : 'stroke-white group-hover:stroke-[#FDB913]'}`} d="M378.33,88.28s2.2-.12,5.19-.23c2.99-.12,2.42-2.03,2.42-2.03"/>
        <path className={`fill-none stroke-[1.62px] stroke-linecap-round stroke-linejoin-round transition-colors ${isActive ? 'stroke-[#FDB913]' : 'stroke-white group-hover:stroke-[#FDB913]'}`} d="M378.33,91.52h-12.58"/>
        <path className={`fill-none stroke-[1.62px] stroke-linecap-round stroke-linejoin-round transition-colors ${isActive ? 'stroke-[#FDB913]' : 'stroke-white group-hover:stroke-[#FDB913]'}`} d="M386.63,80.52s-.56.89-2.58.89h-11.9"/>
        <path className={`fill-none stroke-[1.62px] stroke-linecap-round stroke-linejoin-round transition-colors ${isActive ? 'stroke-[#FDB913]' : 'stroke-white group-hover:stroke-[#FDB913]'}`} d="M381.09,94.88h5.65v.3c0,1.56-1.27,2.82-2.82,2.82h0c-1.56,0-2.82-1.27-2.82-2.82v-.3h0Z"/>
      </g>
    )
  },
  eats: {
    text: 'EATS & DRINKS',
    icon: (isActive: boolean) => (
      <g transform="translate(-618.69, -49.71)">
        <path className={`fill-none stroke-[1.71px] stroke-linecap-round stroke-linejoin-round transition-colors ${isActive ? 'stroke-[#FDB913]' : 'stroke-white group-hover:stroke-[#FDB913]'}`} d="M649.18,85.45l-2.49-2.49-.96.96c-.66.66-1.74.64-2.42-.04l-7.75-7.75c-2.78-2.78-2.85-7.23-.15-9.93h0s14.02,14.02,14.02,14.02l2.9,2.9"/>
        <path className={`fill-none stroke-[1.71px] stroke-linecap-round stroke-linejoin-round transition-colors ${isActive ? 'stroke-[#FDB913]' : 'stroke-white group-hover:stroke-[#FDB913]'}`} d="M655.18,85.98l9.64,9.64c.78.78.8,2.02.04,2.78s-2,.74-2.78-.04l-9.75-9.75"/>
        <path className={`fill-none stroke-[1.71px] stroke-linecap-round stroke-linejoin-round transition-colors ${isActive ? 'stroke-[#FDB913]' : 'stroke-white group-hover:stroke-[#FDB913]'}`} d="M672.1,72.94l-9.67,9.67c-1.13,1.13-2.97,1.13-4.1,0l-16.91,16.91c-.73.73-1.91.73-2.64,0h0c-.73-.73-.73-1.91,0-2.64l16.91-16.91c-1.13-1.13-1.13-2.97,0-4.1l9.67-9.67"/>
        <line className={`fill-none stroke-[1.71px] stroke-linecap-round stroke-linejoin-round transition-colors ${isActive ? 'stroke-[#FDB913]' : 'stroke-white group-hover:stroke-[#FDB913]'}`} x1="667.56" y1="68.39" x2="659.53" y2="76.42"/>
        <line className={`fill-none stroke-[1.71px] stroke-linecap-round stroke-linejoin-round transition-colors ${isActive ? 'stroke-[#FDB913]' : 'stroke-white group-hover:stroke-[#FDB913]'}`} x1="669.82" y1="70.66" x2="661.79" y2="78.68"/>
      </g>
    )
  },
  attractions: {
    text: 'ATTRACTIONS',
    icon: (isActive: boolean) => (
      <g transform="translate(-897.94, -50.73)">
        <circle className={`fill-none stroke-[1.78px] stroke-linecap-round stroke-linejoin-round transition-colors ${isActive ? 'stroke-[#FDB913]' : 'stroke-white group-hover:stroke-[#FDB913]'}`} cx="937.26" cy="70.09" r="3.21"/>
        <circle className={`fill-none stroke-[1.78px] stroke-linecap-round stroke-linejoin-round transition-colors ${isActive ? 'stroke-[#FDB913]' : 'stroke-white group-hover:stroke-[#FDB913]'}`} cx="924.32" cy="76.27" r="3.21"/>
        <path className={`fill-none stroke-[1.78px] stroke-linecap-round stroke-linejoin-round transition-colors ${isActive ? 'stroke-[#FDB913]' : 'stroke-white group-hover:stroke-[#FDB913]'}`} d="M937.26,63.3s-7.16.45-7.16,7.46,7.16,11.74,7.16,11.74c0,0,6.95-4.37,6.95-12.2,0-7.03-6.95-7-6.95-7Z"/>
        <path className={`fill-none stroke-[1.78px] stroke-linecap-round stroke-linejoin-round transition-colors ${isActive ? 'stroke-[#FDB913]' : 'stroke-white group-hover:stroke-[#FDB913]'}`} d="M913.5,86.82c-.27-1.22-.3-1.96-.3-3.26,0-8.81,6.42-16.12,14.84-17.5"/>
        <path className={`fill-none stroke-[1.78px] stroke-linecap-round stroke-linejoin-round transition-colors ${isActive ? 'stroke-[#FDB913]' : 'stroke-white group-hover:stroke-[#FDB913]'}`} d="M946.34,74.75c1.49,2.6,2.34,5.6,2.34,8.81,0,1.6-.21,3.15-.61,4.63"/>
        <path className={`fill-none stroke-[1.78px] stroke-linecap-round stroke-linejoin-round transition-colors ${isActive ? 'stroke-[#FDB913]' : 'stroke-white group-hover:stroke-[#FDB913]'}`} d="M932.77,90.34s4.64-4.96,5.88-4.92c1.78.06,8.17,6.05,8.17,6.05-2.78,6.15-8.69,9.83-15.88,9.83-7.62,0-14.12-4.8-16.63-11.55,0,0,6.73-7.26,8.44-7.25,1.07,0,1.55.13,4.78,3.33,3.22,3.2,12.59,12.16,12.59,12.16"/>
      </g>
    )
  }
};

export function CategoryButton({ type, isActive, onClick }: CategoryButtonProps) {
  const config = categoryConfig[type];

  return (
    <Link to={categoryPaths[type]} onClick={onClick} className="group relative flex items-center">
      {/* Golden Circle with Icon - using SVG viewBox to maintain aspect ratio */}
      <div className="relative flex-shrink-0 z-10" style={{ width: '70px', height: '70px' }}>
        <svg viewBox="0 0 70 70" className="w-full h-full">
          {/* Golden Circle with black fill */}
          <circle 
            cx="35" 
            cy="35" 
            r="33.3" 
            fill="black"
            stroke="#FDB913"
            strokeWidth="2"
          />
          {/* Icon centered in circle */}
          <g transform="translate(2, 2)">
            {config.icon(isActive)}
          </g>
        </svg>
      </div>

      {/* Text Button with border - overlapped with circle - yellow when active */}
      <div className={`relative flex-1 px-6 py-3.5 pl-8 border-[1.5px] rounded-[15px] transition-all -ml-4 ${
        isActive 
          ? 'border-[#FDB913]' 
          : 'border-white group-hover:border-[#FDB913]'
      }`}>
        <span className={`font-semibold text-sm tracking-wide transition-colors ${
          isActive 
            ? 'text-[#FDB913]' 
            : 'text-white group-hover:text-[#FDB913]'
        }`}>{config.text}</span>
      </div>
    </Link>
  );
}