document.addEventListener('DOMContentLoaded', () => {
    function restrictUserInput() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
            }
        });

        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.altKey || e.metaKey) {
                e.preventDefault();
            }
        });
    }

    restrictUserInput();
});