let connections: Map<string, Set<ReadableStreamDefaultController>> = new Map();

export function addConnection(userId: string, controller: ReadableStreamDefaultController) {
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId).add(controller);
}

export function removeConnection(userId: string, controller: ReadableStreamDefaultController) {
  if (connections.has(userId)) {
    connections.get(userId).delete(controller);
    if (connections.get(userId).size === 0) {
      connections.delete(userId);
    }
  }
}

function sendToController(controller: ReadableStreamDefaultController, message: string, userId: string) {
  try {
    controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Controller is already closed')) {
      // If the controller is closed, remove it from the set
      removeConnection(userId, controller);
    } else {
      // If it's a different error, log it
      console.error('Error sending message:', error);
    }
  }
}

export function sendMessage(message: string, userId: string | null = null) {
  if (userId) {
    if (connections.has(userId)) {
      connections.get(userId).forEach((controller) => {
        sendToController(controller, message, userId);
      });
    }
  } else {
    connections.forEach((controllers, key) => {
      controllers.forEach((controller) => {
        sendToController(controller, message, key);
      });
    });
  }
}
