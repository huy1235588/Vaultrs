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
            {/* Sidebar */}
            <Sidebar />

            {/* Main content */}
            <main className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <Header onAddItem={onAddItem} />

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">{children}</div>
            </main>
        </div>
    );
}

export default MainLayout;
