/**
 * MainLayout — Application shell with sidebar, header, and main content area.
 *
 * Composes the Sidebar and Header components into the full app layout.
 */
import Sidebar from "./Sidebar";
import Header from "./Header";

interface MainLayoutProps {
    children: React.ReactNode;
    /** Called when user clicks "Add Item" in the header. */
    onAddItem?: () => void;
}

function MainLayout({ children, onAddItem }: MainLayoutProps) {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Skip link — lets keyboard users jump past the chrome */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-1.5 focus:text-sm focus:font-medium focus:text-primary-foreground"
            >
                Skip to content
            </a>

            {/* Sidebar */}
            <Sidebar />

            {/* Main content */}
            <main className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <Header onAddItem={onAddItem} />

                {/* Content */}
                <div id="main-content" className="flex-1 overflow-y-auto p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

export default MainLayout;
