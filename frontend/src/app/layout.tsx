import type{Metadata,Viewport}from"next";import"./globals.css";import{ServiceWorker}from"@/components/ServiceWorker";
export const metadata:Metadata={title:{default:"Shuttle Squad",template:"%s · Shuttle Squad"},description:"Private badminton score tracker",appleWebApp:{capable:true,statusBarStyle:"black-translucent",title:"Shuttle Squad"}};export const viewport:Viewport={themeColor:"#b7f34a",width:"device-width",initialScale:1,viewportFit:"cover"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><ServiceWorker/>{children}</body></html>}
