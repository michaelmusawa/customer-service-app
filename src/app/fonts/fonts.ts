import localFont from 'next/font/local';

 
export const inter = localFont({
  src: [
    {
      path: './Inter/static/Inter_18pt-Black.ttf',
      weight: '900',
      style: 'normal'
    },{
      path: './Inter/static/Inter_18pt-ExtraBold.ttf',
      weight: '800',
      style: 'normal'
    },{
      path: './Inter/static/Inter_18pt-Bold.ttf',
      weight: '700',
      style: 'normal'
    },{
      path: './Inter/static/Inter_18pt-Medium.ttf',
      weight: '500',
      style: 'normal'
    },{
      path: './Inter/static/Inter_18pt-Regular.ttf',
      weight: '400',
      style: 'normal'
    },{
      path: './Inter/static/Inter_18pt-Black.ttf',
      weight: '900',
      style: 'normal'
    },{
      path: './Inter/static/Inter_18pt-Thin.ttf',
      weight: '200',
      style: 'normal'
    },{
      path: './Inter/static/Inter_18pt-ExtraLight.ttf',
      weight: '100',
      style: 'normal'
    }  
  ], 
  variable: '--font-inter',
 });
 
export const lusitana = localFont({
  src: [
    {
      path: './Lusitana/Lusitana-Bold.ttf',
      weight: '700',
      style: 'normal'
    },{
      path: './Lusitana/Lusitana-Regular.ttf',
      weight: '400',
      style: 'normal'
    }
  ],
  variable: '--font-lusitana',
});