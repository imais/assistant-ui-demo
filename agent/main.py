#!/usr/bin/env python3
"""
Assistant Transport Backend with LangGraph - FastAPI + assistant-stream + LangGraph server
"""

import os
import asyncio
import logging
from typing import Dict, Any, List, Optional, Union, Sequence, Annotated
from contextlib import asynccontextmanager
import uvicorn
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from assistant_stream.serialization import DataStreamResponse
from assistant_stream import RunController, create_run
from assistant_stream.modules.langgraph import append_langgraph_event, get_tool_call_subgraph_state

from langgraph.graph import StateGraph, END
from langgraph.graph.state import CompiledStateGraph
from langgraph.graph import add_messages
from langgraph.prebuilt import ToolNode

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage, BaseMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from typing import TypedDict

# Load environment variables
load_dotenv()


class MessagePart(BaseModel):
    """A part of a user message."""
    type: str = Field(..., description="The type of message part")
    text: Optional[str] = Field(None, description="Text content")
    image: Optional[str] = Field(None, description="Image URL or data")


class UserMessage(BaseModel):
    """A user message."""
    role: str = Field(default="user", description="Message role")
    parts: List[MessagePart] = Field(..., description="Message parts")


class AddMessageCommand(BaseModel):
    """Command to add a new message to the conversation."""
    type: str = Field(default="add-message", description="Command type")
    message: UserMessage = Field(..., description="User message")


class AddToolResultCommand(BaseModel):
    """Command to add a tool result to the conversation."""
    type: str = Field(default="add-tool-result", description="Command type")
    toolCallId: str = Field(..., description="ID of the tool call")
    result: Dict[str, Any] = Field(..., description="Tool execution result")


class ChatRequest(BaseModel):
    """Request payload for the chat endpoint."""
    commands: List[Union[AddMessageCommand, AddToolResultCommand]] = Field(
        ..., description="List of commands to execute"
    )
    system: Optional[str] = Field(None, description="System prompt")
    tools: Optional[Dict[str, Any]] = Field(None, description="Available tools")
    runConfig: Optional[Dict[str, Any]] = Field(None, description="Run configuration")
    state: Optional[Dict[str, Any]] = Field(None, description="State")


# Define LangGraph state
class GraphState(TypedDict):
    """State for the conversation graph."""
    messages: Annotated[Sequence[BaseMessage], add_messages]


# Define subagent state
class SubagentState(TypedDict):
    """State for the subagent."""
    messages: Annotated[Sequence[BaseMessage], add_messages]
    task: str
    result: str


# Create the Task tool
@tool
def task_tool(task_description: str) -> str:
    """
    Execute a complex task using a subagent.

    Args:
        task_description: Description of the task to perform

    Returns:
        The result of the task execution
    """
    # This is a placeholder - the actual execution will be handled by the subgraph
    return f"Task '{task_description}' will be executed by the subagent."


# Create the Weather tool (backend tool)
@tool
def get_weather(location: str, unit: str = "celsius") -> str:
    """
    Get the current weather for a city.
    
    This tool fetches weather information from a weather API.
    The execution happens on the backend server.

    Args:
        location: The city to get weather for
        unit: Temperature unit (celsius or fahrenheit), defaults to celsius

    Returns:
        Weather information as JSON string
    """
    import random
    
    # Simulate API call delay
    # In production, replace this with actual weather API call (e.g., OpenWeatherMap)
    # Example: 
    # import httpx
    # async with httpx.AsyncClient() as client:
    #     response = await client.get(f"https://api.openweathermap.org/data/2.5/weather?q={location}&appid={API_KEY}")
    #     data = response.json()
    
    # For now, return mock weather data
    temp = random.randint(10, 30)
    conditions = ["sunny", "cloudy", "rainy", "partly cloudy", "overcast"]
    condition = random.choice(conditions)
    
    weather_data = {
        "location": location,
        "temperature": temp,
        "unit": unit,
        "condition": condition,
        "humidity": random.randint(40, 80),
        "windSpeed": random.randint(5, 25),
        "description": f"The weather in {location} is {condition} with a temperature of {temp}°{unit[0].upper()}."
    }
    
    return json.dumps(weather_data, ensure_ascii=False)

# Create the Search Products tool
@tool
def search_products(query: str) -> str:
    """
    Search for products in the database.
    
    This tool searches for products matching the given query string.
    Use this tool when the user asks about products, wants to search for items,
    or needs to find specific products in the catalog.
    
    Args:
        query: The search query string to find products (e.g., product name, category, or keywords)
    
    Returns:
        A JSON string containing product data with columns (id, name, price) and rows
    """

    # For now, return mock products data
    products = [
        {
            "id": 1,
            "name": "Product 1",
            "price": 100
        },
        {
            "id": 2,
            "name": "Product 2",
            "price": 200
        },
        {
            "id": 3,
            "name": "Product 3",
            "price": 300
        }
    ]
    # Convert products to a DataTable
    data_table = {
        "data": products,
        "columns": ["id", "name", "price"],
        "row_id_key": "id",
        "description": "Products data table"
    }
    return json.dumps(data_table, ensure_ascii=False)

# Create graph display tool
@tool
def display_graph(plot_type: str) -> str: 
    """
    Display a graph in a user-friendly way.
    
    This tool displays a graph in a user-friendly way. 
    Use this tool when the user asks about a graph, wants to see a graph, or needs to display a graph.
    
    IMPORTANT: After calling this tool, the graph is automatically displayed in the UI component.
    DO NOT repeat, explain, or output the tool's result in your response.
    DO NOT format tool results as Markdown images (e.g., ![title](data:image/...)).
    DO NOT output JSON data, base64 data, or any raw tool result data.
    Simply acknowledge that the graph has been displayed.
    
    Args:
        plot_type: The type of plot to display (e.g., "bar", "line", "pie")
    """
    if plot_type == "bar":
        # Bar chart dummy data
        dummy_data = {
            "labels": ["Q1", "Q2", "Q3", "Q4"],
            "values": [120, 150, 180, 200],
            "title": "Quarterly Sales",
            "xlabel": "Quarter",
            "ylabel": "Sales (thousands)"
        }
        return json.dumps(dummy_data, ensure_ascii=False)
    
    elif plot_type == "line":
        # Line chart dummy data
        dummy_data = {
            "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            "values": [45, 52, 48, 61, 55, 67],
            "title": "Monthly Revenue Trend",
            "xlabel": "Month",
            "ylabel": "Revenue (thousands)"
        }
        return json.dumps(dummy_data, ensure_ascii=False)
    
    elif plot_type == "pie":
        # Pie chart dummy data
        dummy_data = {
            "labels": ["Product A", "Product B", "Product C", "Product D"],
            "values": [30, 25, 20, 25],
            "title": "Product Sales Distribution"
        }
        return json.dumps(dummy_data, ensure_ascii=False)
    
    else:
        # Default: return empty data for unsupported plot types
        return json.dumps({"error": f"Unsupported plot type: {plot_type}"}, ensure_ascii=False)


# Subagent node for executing tasks
async def subagent_node(state: SubagentState) -> Dict[str, Any]:
    """Subagent that executes the task."""
    logger.info("🟢 [SUBGRAPH NODE] START: execute_task")
    messages = state.get("messages", [])
    task = state.get("task", "")
    logger.info(f"📝 [SUBGRAPH] Task: {task}")

    # Initialize a simpler LLM for the subagent
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.7,
        streaming=True
    )

    # Create a prompt for the subagent
    subagent_messages = [
        SystemMessage(content=f"You are a helpful subagent. Execute this task: {task}"),
        HumanMessage(content=f"Please complete the following task: {task}")
    ]

    # Generate response
    if os.getenv("OPENAI_API_KEY"):
        response = await llm.ainvoke(subagent_messages)
        result = response.content
    else:
        result = f"Mock subagent result for task: {task}"

    logger.info("🔴 [SUBGRAPH NODE] END: execute_task")
    return {
        "messages": [AIMessage(content=result)],
        "result": result
    }


def create_subagent_graph() -> CompiledStateGraph:
    """Create the subagent graph."""
    workflow = StateGraph(SubagentState)

    # Add the subagent node
    workflow.add_node("execute_task", subagent_node)

    # Set entry and exit points
    workflow.set_entry_point("execute_task")
    workflow.add_edge("execute_task", END)

    return workflow.compile()


async def agent_node(state: GraphState) -> Dict[str, Any]:
    """Main agent node that can call tools."""
    logger.info("🟢 [LANGGRAPH NODE] START: agent")
    messages = state.get("messages", [])
    
    # Add system message to prevent LLM from repeating tool results
    system_message = SystemMessage(
        content="When you call a tool and receive a result, the result is automatically displayed in the UI. "
                "DO NOT repeat, explain, or output the tool's result data in your response. "
                "DO NOT output JSON data, base64-encoded data, or raw tool results. "
                "DO NOT format tool results as Markdown images (e.g., ![title](data:image/...)) or code blocks. "
                "Simply acknowledge that the requested action has been completed. "
                "For display_graph tool: The graph is already displayed in the UI component, so just confirm it was displayed."
    )

    # Initialize the LLM with tool binding
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.7,
        streaming=True,
    )

    # Bind tools to the LLM (both backend and frontend tools)
    llm_with_tools = llm.bind_tools([task_tool, get_weather, search_products, display_graph])

    # Prepare messages with system message at the beginning (only if not already present)
    messages_list = list(messages)
    if not any(isinstance(msg, SystemMessage) for msg in messages_list):
        messages_with_system = [system_message] + messages_list
    else:
        messages_with_system = messages_list

    # Check if OpenAI API key is set
    if os.getenv("OPENAI_API_KEY"):
        response = await llm_with_tools.ainvoke(messages_with_system)
    else:
        # Mock response with a tool call for testing
        logger.debug("⚠️ No OpenAI API key found - using mock response with tool call")
        response = AIMessage(
            content="I'll help you with that task.",
            tool_calls=[{
                "id": "task_001",
                "name": "task_tool",
                "args": {"task_description": "Complete the requested task"}
            }]
        )

    logger.info("🔴 [LANGGRAPH NODE] END: agent")
    return {"messages": [response]}


def should_call_tools(state: GraphState) -> str:
    """Determine if tools should be called."""
    messages = state.get("messages", [])
    if not messages:
        logger.info("🔴 [LANGGRAPH NODE] END: Graph execution ended (no messages)")
        return "end"

    last_message = messages[-1]
    # Check if the last message has tool calls
    if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
        return "tools"

    logger.info("🔴 [LANGGRAPH NODE] END: Graph execution ended (no tool calls)")
    return "end"


async def tool_executor_node(state: GraphState) -> Dict[str, Any]:
    """Execute tool calls, including Task tool which spawns subagents."""
    logger.info("🟢 [LANGGRAPH NODE] START: tools")
    messages = state.get("messages", [])
    if not messages:
        logger.info("🔴 [LANGGRAPH NODE] END: tools (no messages)")
        return {"messages": []}

    last_message = messages[-1]
    if not hasattr(last_message, 'tool_calls') or not last_message.tool_calls:
        logger.info("🔴 [LANGGRAPH NODE] END: tools (no tool calls)")
        return {"messages": []}
    
    logger.info(f"🔨 [TOOL EXECUTOR] Processing {len(last_message.tool_calls)} tool call(s)")
    
    # Process each tool call
    tool_messages = []
    for tool_call in last_message.tool_calls:
        tool_name = tool_call.get("name", "unknown")
        tool_args = tool_call.get("args", {})
        logger.info(f"🔧 [TOOL CALL] Tool: {tool_name}, Args: {tool_args}")
        
        if tool_call["name"] == "task_tool":
            # Extract task description
            task_description = tool_call["args"].get("task_description", "")
            logger.info(f"📋 [TASK TOOL] Executing task: {task_description}")

            # Create and run the subagent graph

            # Initialize subagent state
            subagent_state = {
                "messages": [],
                "task": task_description,
                "result": ""
            }

            # Run the subagent
            logger.info(f"🤖 [TASK TOOL] Spawning subagent for task...")
            final_state = await subagent_graph.ainvoke(subagent_state)
            logger.info(f"✅ [TASK TOOL] Subagent completed task")

            # Create tool message with the result
            tool_message = ToolMessage(
                content=final_state.get("result", "Task completed"),
                tool_call_id=tool_call["id"],
                name=tool_call["name"],
                artifact={"subgraph_state": final_state}
            )
            tool_messages.append(tool_message)
        elif tool_call["name"] == "get_weather":
            # Backend tool - execute the weather tool
            location = tool_call["args"].get("location", "unknown")
            unit = tool_call["args"].get("unit", "celsius")
            logger.info(f"🌤️  [WEATHER] Fetching weather for {location} ({unit})")
            
            # Execute the tool function
            try:
                weather_result = get_weather.invoke({"location": location, "unit": unit})
                logger.info(f"✅ [WEATHER] Successfully fetched weather for {location}")
                tool_message = ToolMessage(
                    content=weather_result,
                    tool_call_id=tool_call["id"],
                    name=tool_call["name"]
                )
            except Exception as e:
                # Handle errors gracefully
                error_message = f"Error fetching weather for {location}: {str(e)}"
                logger.error(f"❌ [WEATHER] Error: {error_message}")
                tool_message = ToolMessage(
                    content=error_message,
                    tool_call_id=tool_call["id"],
                    name=tool_call["name"]
                )
            
            tool_messages.append(tool_message)
        elif tool_call["name"] == "search_products":
            # Frontend tool - execute the search products tool
            query = tool_call["args"].get("query", "")
            logger.info(f"📦 [SEARCH PRODUCTS] Searching for: {query}")
            try:
                search_products_result = search_products.invoke({"query": query})
                logger.info(f"✅ [SEARCH PRODUCTS] Found products for query: {query}")
                tool_message = ToolMessage(
                    content=search_products_result,
                    tool_call_id=tool_call["id"],
                    name=tool_call["name"]
                )
            except Exception as e:
                # Handle errors gracefully
                error_message = f"Error searching products for {query}: {str(e)}"
                logger.error(f"❌ [SEARCH PRODUCTS] Error: {error_message}")
                tool_message = ToolMessage(
                    content=error_message,
                    tool_call_id=tool_call["id"],
                    name=tool_call["name"]
                )

            tool_messages.append(tool_message)
        elif tool_call["name"] == "display_graph":
            # Backend tool - execute the display graph tool
            plot_type = tool_call["args"].get("plot_type", "bar")
            logger.info(f"📊 [DISPLAY GRAPH] Plot type: {plot_type}")
            try:
                graph_result = display_graph.invoke({"plot_type": plot_type})
                logger.info(f"✅ [DISPLAY GRAPH] Successfully generated {plot_type} chart")
                tool_message = ToolMessage(
                    content=graph_result,
                    tool_call_id=tool_call["id"],
                    name=tool_call["name"]
                )
            except Exception as e:
                # Handle errors gracefully
                error_message = f"Error displaying graph with plot_type {plot_type}: {str(e)}"
                logger.error(f"❌ [DISPLAY GRAPH] Error: {error_message}")
                tool_message = ToolMessage(
                    content=error_message,
                    tool_call_id=tool_call["id"],
                    name=tool_call["name"]
                )
            
            tool_messages.append(tool_message)
        else:
            # Handle other tools if any
            logger.info(f"⚠️  [UNKNOWN TOOL] Tool name: {tool_call.get('name', 'unknown')}")
            tool_message = ToolMessage(
                content=f"Executed tool {tool_call['name']}",
                tool_call_id=tool_call["id"],
                name=tool_call["name"]
            )
            tool_messages.append(tool_message)

    logger.info("🔴 [LANGGRAPH NODE] END: tools")
    return {"messages": tool_messages}


subagent_graph = create_subagent_graph()

def create_graph() -> CompiledStateGraph:
    """Create and compile the LangGraph with subgraph support."""
    # Create the main workflow
    workflow = StateGraph(GraphState)

    # Add nodes
    workflow.add_node("agent", agent_node)
    workflow.add_node("tools", tool_executor_node)

    # Set entry point
    workflow.set_entry_point("agent")

    # Add conditional edges
    workflow.add_conditional_edges(
        "agent",
        should_call_tools,
        {
            "tools": "tools",
            "end": END
        }
    )

    # After tools, go back to agent for potential follow-up
    workflow.add_edge("tools", "agent")

    # Compile the graph
    return workflow.compile()

graph = create_graph()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    logger.debug("🚀 Assistant Transport Backend with LangGraph starting up...")
    yield
    logger.debug("🛑 Assistant Transport Backend with LangGraph shutting down...")


# Create FastAPI app
app = FastAPI(
    title="Assistant Transport Backend with LangGraph",
    description="A server implementing the assistant-transport protocol with LangGraph and subgraphs",
    version="0.2.0",
    lifespan=lifespan,
)

# Configure CORS
cors_origins = ["*"]  # Allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


@app.post("/assistant")
async def chat_endpoint(request: ChatRequest):
    """Chat endpoint using LangGraph with streaming and subgraph support."""

    async def run_callback(controller: RunController):
        """Callback function for the run controller."""
        # Initialize controller state if needed
        if controller.state is None:
            controller.state = {}
        if "messages" not in controller.state:
            controller.state["messages"] = []

        input_messages = []

        # Process commands
        for command in request.commands:
            if command.type == "add-message":
                # Extract text from parts
                text_parts = [
                    part.text for part in command.message.parts
                    if part.type == "text" and part.text
                ]
                if text_parts:
                    user_message_content = " ".join(text_parts)
                    logger.info(f"👤 [USER INPUT] Message: {user_message_content}")
                    input_messages.append(HumanMessage(content=user_message_content))
            elif command.type == "add-tool-result":
                # Handle tool results
                input_messages.append(ToolMessage(
                    content=str(command.result),
                    tool_call_id=command.toolCallId
                ))

        # Add messages to controller state
        for message in input_messages:
            controller.state["messages"].append(message.model_dump())

        # Create initial state for LangGraph
        input_state = {"messages": input_messages}
        
        logger.info("🟢 [LANGGRAPH] START: Graph execution started")

        # Stream with subgraph support
        async for namespace, event_type, chunk in graph.astream(
            input_state,
            stream_mode=["messages", "updates"],
            subgraphs=True
        ):
            state = get_tool_call_subgraph_state(
                controller,
                subgraph_node="tools",
                namespace=namespace,
                artifact_field_name="subgraph_state",
                default_state={}
            )
            # Append the event normally
            append_langgraph_event(
                state,
                namespace,
                event_type,
                chunk
            )
        
        logger.info("🔴 [LANGGRAPH] END: Graph execution completed")

    # Create streaming response using assistant-stream
    stream = create_run(run_callback, state=request.state)

    return DataStreamResponse(stream)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "assistant-transport-backend-langgraph"}


def main():
    """Main entry point for running the server."""
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8010"))
    # debug = os.getenv("DEBUG", "false").lower() == "true"
    debug = True
    log_level = os.getenv("LOG_LEVEL", "info").lower()  # Default to info level
    
    # Set logging level based on environment variable
    if log_level == "debug":
        logging.getLogger().setLevel(logging.DEBUG)
    elif log_level == "info":
        logging.getLogger().setLevel(logging.INFO)
    elif log_level == "warning":
        logging.getLogger().setLevel(logging.WARNING)
    elif log_level == "error":
        logging.getLogger().setLevel(logging.ERROR)
    else:
        logging.getLogger().setLevel(logging.INFO)  # Default to INFO

    logger.info(f"🌟 Starting Assistant Transport Backend with LangGraph on {host}:{port}")
    logger.info(f"🎯 Debug mode: {debug}")
    logger.info(f"🌍 CORS origins: {cors_origins}")
    logger.info(f"📊 Log level: {logging.getLevelName(logging.getLogger().level)}")

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level=log_level,
        access_log=True,
    )


if __name__ == "__main__":
    main()