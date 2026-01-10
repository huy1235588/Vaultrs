// Main application layout with sidebar and content area

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
    children: ReactNode;
    onCreateVault?: () => void;
}

export function MainLayout({ children, onCreateVault }: MainLayoutProps) {
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background">
            {/* Sidebar */}
            <Sidebar onCreateVault={onCreateVault} />

            {/* Main content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {children}
            </main>
        </div>
    );
}
