// Main application layout with collapsible sidebar, toolbar, content, detail panel, and status bar

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Toolbar } from './Toolbar';
import { StatusBar } from './StatusBar';
import { DetailPanel } from './DetailPanel';
import { ResizeHandle } from './ResizeHandle';
import { useUIStore } from '@/stores/uiStore';

interface MainLayoutProps {
    children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const {
        detailPanelOpen,
        setDetailPanelWidth,
    } = useUIStore();

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background">
            {/* Sidebar */}
            <Sidebar />

            {/* Main area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Toolbar */}
                <Toolbar />

                {/* Content + Detail Panel */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Content area */}
                    <main className="flex-1 flex flex-col overflow-hidden">
                        {children}
                    </main>

                    {/* Detail Panel */}
                    {detailPanelOpen && (
                        <>
                            <ResizeHandle
                                onResize={setDetailPanelWidth}
                            />
                            <DetailPanel />
                        </>
                    )}
                </div>

                {/* Status Bar */}
                <StatusBar />
            </div>
        </div>
    );
}
