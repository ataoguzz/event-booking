import {Link} from 'react-router-dom'

const Forbidden = () => {
    return (
        <div className="w-screen" style={styles.container}>
            <h1 style={styles.header}>403 - Forbidden</h1>
            <p style={styles.message}>
                You do not have permission to access this page.
            </p>
            <Link to="/home">Go Back</Link>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center', // Centers items horizontally
        justifyContent: 'center', // Centers items vertically
        height: '100vh', // Full viewport height
        width: '100vw', // Full viewport width
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        color: '#333',
        fontFamily: 'Arial, sans-serif',
    },
    header: {
        fontSize: '2.5rem',
        marginBottom: '1rem',
        color: '#dc3545', // Red color for emphasis
    },
    message: {
        fontSize: '1.25rem',
        marginBottom: '1.5rem',
    },
};

export default Forbidden;
