let connections: Set<ReadableStreamDefaultController> = new Set();

export function addConnection(controller: ReadableStreamDefaultController) {
  connections.add(controller);
}

export function removeConnection(controller: ReadableStreamDefaultController) {
  connections.delete(controller);
}

export function sendMessage(message: any) {
  connections.forEach(controller => {
    try {
      controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Controller is already closed')) {
        // If the controller is closed, remove it from the set
        removeConnection(controller);
      } else {
        // If it's a different error, log it
        console.error('Error sending message:', error);
      }
    }
  });
}