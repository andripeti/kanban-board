import './globals.css'

export const metadata = {
  title: 'Kanban Tasks',
  description: 'Task/To-Do Manager with Kanban Board'
}

export default function RootLayout({ children }){
  return (
    <html lang="en">
      <body>
        <div className="container">
          <h1 style={{marginBottom:12}}>Kanban Task Manager</h1>
          {children}
        </div>
      </body>
    </html>
  )
}
