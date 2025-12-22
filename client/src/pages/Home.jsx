function Home() {
  return (
    <div className="card">
      <h2>Welcome to the Event Portal</h2>
      <p>This application is connected to the cloud database.</p>
      <p>
        Status: 
        <span style={{ color: 'green', fontWeight: 'bold', marginLeft: '8px' }}>
          Connected
        </span>
      </p>
    </div>
  );
}

export default Home;