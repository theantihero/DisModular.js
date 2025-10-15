# Plugin Editor Guide

The DisModular.js Plugin Editor is a powerful visual interface built with React Flow for creating Discord bot plugins without writing code. This comprehensive guide will walk you through creating workflows from basic to advanced, covering all node types and best practices.

## Table of Contents

- [Getting Started](#getting-started)
- [Editor Interface](#editor-interface)
- [Node Types Reference](#node-types-reference)
- [Creating Workflows](#creating-workflows)
- [Advanced Examples](#advanced-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Sharing and Collaboration](#sharing-and-collaboration)

## Getting Started

### Accessing the Editor

1. **Login** to the dashboard with Discord
2. **Navigate** to the Plugin Editor
3. **Click** "Create New Plugin" to start

### Editor Interface Overview

The editor consists of several key areas:

- **Canvas**: Main workspace where you build your workflow
- **Node Palette**: Library of available nodes on the left
- **Property Panel**: Configuration panel on the right
- **Toolbar**: Top toolbar with actions and tools
- **Status Bar**: Bottom status bar with compile info

## Creating Your First Plugin

### Step 1: Choose Your Plugin Type

When creating a new plugin, you'll need to choose:

- **Slash Command**: Modern Discord slash command (`/command`)
- **Text Command**: Traditional text command (`!command`)
- **Both**: Supports both slash and text commands

**Example**: Let's create a "Hello World" plugin as a slash command.

### Step 2: Add a Trigger Node

1. **Drag** a "Trigger" node from the palette to the canvas
2. **Configure** the trigger:
   - **Command Name**: `hello`
   - **Description**: `Say hello to the user`
   - **Type**: `slash` (for slash commands)

The trigger node (green) is where your plugin starts when the command is used.

### Step 3: Add a Response Node

1. **Drag** a "Response" node from the palette
2. **Connect** it to the trigger node by dragging from the trigger's output to the response's input
3. **Configure** the response:
   - **Message**: `Hello, {{user.username}}! Welcome to our server!`

The response node (blue) sends a message back to the user.

### Step 4: Test Your Plugin

1. **Click** "Test Compile" in the toolbar
2. **Review** the generated code in the compile panel
3. **Save** your plugin if everything looks good

### Step 5: Save and Deploy

1. **Click** "Save Plugin"
2. **Enter** plugin details:
   - **Name**: "Hello World"
   - **Description**: "A simple greeting plugin"
   - **Author**: Your name
3. **Click** "Save"

Your plugin is now active and ready to use!

## Advanced Workflow: Poll Plugin

Let's create a more complex plugin - a poll system with multiple options and result calculation.

### Step 1: Create the Poll Plugin

1. **Create** a new plugin
2. **Type**: Slash command
3. **Command**: `poll`
4. **Description**: `Create a poll with multiple options`

### Step 2: Add Trigger with Options

1. **Add** a trigger node
2. **Configure** with options:
   - **Question**: String input for poll question
   - **Option1**: String input for first option
   - **Option2**: String input for second option
   - **Option3**: String input for third option
   - **Duration**: Number input for poll duration (minutes)

### Step 3: Create Poll Data

1. **Add** a "Data" node
2. **Configure** to store poll information:
   - **Question**: `{{trigger.question}}`
   - **Options**: `[{{trigger.option1}}, {{trigger.option2}}, {{trigger.option3}}]`
   - **Duration**: `{{trigger.duration}}`
   - **Votes**: `{}`

### Step 4: Build Poll Embed

1. **Add** an "Embed Builder" node
2. **Configure** the embed:
   - **Title**: `📊 Poll: {{data.question}}`
   - **Description**: `React with the numbers to vote!`
   - **Color**: `#00ff00` (green)
   - **Fields**: 
     - `1️⃣ {{data.options[0]}}`
     - `2️⃣ {{data.options[1]}}`
     - `3️⃣ {{data.options[2]}}`
   - **Footer**: `Poll ends in {{data.duration}} minutes`

### Step 5: Send Poll Message

1. **Add** an "Embed Response" node
2. **Connect** it to the embed builder
3. **Configure** to send the embed

### Step 6: Add Reaction Collection

1. **Add** a "Discord Action" node
2. **Configure** to add reactions:
   - **Action**: `add_reaction`
   - **Emoji**: `1️⃣`, `2️⃣`, `3️⃣`
   - **Message**: `{{embed_response.message}}`

### Step 7: Set Poll Timer

1. **Add** a "Wait" node
2. **Configure** duration:
   - **Time**: `{{data.duration * 60000}}` (convert minutes to milliseconds)

### Step 8: Calculate Results

1. **Add** a "Math Operation" node
2. **Configure** to count votes:
   - **Operation**: `count`
   - **Data**: `{{discord_action.reactions}}`

### Step 9: Display Results

1. **Add** another "Embed Builder" node
2. **Configure** results embed:
   - **Title**: `📊 Poll Results: {{data.question}}`
   - **Description**: `Poll has ended! Here are the results:`
   - **Fields**: Show vote counts for each option
   - **Color**: `#ff0000` (red)

### Step 10: Send Results

1. **Add** an "Embed Response" node
2. **Connect** to the results embed
3. **Configure** to send the final results

## Node Types Reference

### Core Nodes

#### Trigger Node (Green)
**Purpose**: Starts plugin execution when a command is called
**Inputs**: None
**Outputs**: Execution flow
**Configuration**:
- Command name (e.g., "hello", "poll")
- Description for slash commands
- Command type (slash, text, or both)
- Required permissions
- Command options (for slash commands)

#### Response Node (Blue)
**Purpose**: Sends a text message back to the user
**Inputs**: Execution flow, message content
**Outputs**: None
**Configuration**:
- Message content (supports variables like `{{user.username}}`)
- Ephemeral response (only visible to command user)
- Reply to original message
- Message formatting (bold, italic, code blocks)

#### Variable Node (Purple)
**Purpose**: Stores and retrieves data during execution
**Inputs**: Value to store
**Outputs**: Stored value
**Configuration**:
- Variable name
- Variable type (string, number, boolean, object, array)
- Default value
- Scope (local, global, user, guild)

#### Data Node (Cyan)
**Purpose**: Retrieves Discord context data
**Inputs**: None
**Outputs**: Data object
**Configuration**:
- Data type (user info, guild info, channel info, message info)
- Specific fields to retrieve
- Fallback values

### Control Flow

**Condition Node (Yellow)**
- Implements if/else logic
- Two output branches: true/false
- Supports complex conditions

**Comparison Node (Yellow)**
- Compares two values
- Operators: ==, !=, >, <, >=, <=, includes
- Type-aware comparisons

**Loop Node (Pink)**
- Repeats actions
- While loop with condition
- For loop with counter
- Maximum iteration protection

### Discord Features

**Embed Builder Node (Purple)**
- Creates rich Discord embeds
- Full customization options
- Dynamic content support

**Discord Action Node (Indigo)**
- Performs Discord actions
- Add reactions, send DMs
- Check permissions, roles

### Data Manipulation

**Variable Node (Teal)**
- Store temporary data
- Variable interpolation
- Type conversion

**Array Operation Node (Teal)**
- Array manipulation
- Create, push, pop, filter, map
- Length, join, slice operations

**String Operation Node (Emerald)**
- String manipulation
- Concat, split, replace, match
- Case conversion, trimming

**Math Operation Node (Amber)**
- Mathematical operations
- Basic arithmetic: +, -, ×, ÷
- Advanced: %, ^, √, |x|

### External & Storage

**HTTP Request Node (Orange)**
- Make API calls
- Full HTTP method support
- Headers, body, timeout configuration

**Database Node (Slate)**
- Persistent storage
- Get, set, delete, list operations
- Plugin-specific data isolation

**JSON Node (Gray)**
- Parse and stringify JSON
- Data validation
- Error handling

## Best Practices

### Plugin Design

1. **Keep it Simple**: Start with basic functionality
2. **Test Frequently**: Use the compile panel to check your work
3. **Use Variables**: Store data for reuse across nodes
4. **Handle Errors**: Add error handling for external APIs
5. **Document**: Add clear descriptions to your nodes

### Performance

1. **Minimize HTTP Requests**: Cache data when possible
2. **Use Efficient Loops**: Avoid infinite loops
3. **Optimize Data**: Only store necessary information
4. **Test Limits**: Be aware of Discord rate limits

### Security

1. **Validate Input**: Check user inputs before processing
2. **Sanitize Data**: Clean data before storing or displaying
3. **Handle Permissions**: Check user permissions for sensitive actions
4. **Limit Resources**: Set reasonable timeouts and limits

## Troubleshooting

### Common Issues

**Plugin won't compile:**
- Check for disconnected nodes
- Verify all required inputs are connected
- Review node configurations

**Plugin doesn't respond:**
- Ensure plugin is enabled
- Check command name and type
- Verify bot permissions

**Variables not working:**
- Check variable names match exactly
- Ensure variables are defined before use
- Use proper interpolation syntax: `{{variable.name}}`

**External API errors:**
- Verify API endpoints and keys
- Check network connectivity
- Handle error responses properly

### Debug Tips

1. **Use Test Compile**: Always test before saving
2. **Check Logs**: Review bot logs for errors
3. **Start Simple**: Build complex plugins incrementally
4. **Use Console**: Add debug nodes to log data
5. **Test Permissions**: Ensure bot has required permissions

## Sharing and Collaboration

### Exporting Plugins

1. **Click** "Export" in the plugin editor
2. **Choose** export format (JSON)
3. **Save** the file to share

### Importing Plugins

1. **Click** "Import" in the plugin editor
2. **Select** the JSON file
3. **Review** the imported workflow
4. **Save** as a new plugin

### Community Sharing

- Share plugins on GitHub
- Post in Discord communities
- Create plugin templates
- Document your workflows

## Advanced Features

### Custom Nodes

For advanced users, custom nodes can be created:

1. **Define** node structure
2. **Implement** execution logic
3. **Add** to node palette
4. **Test** thoroughly

### Plugin Templates

Create reusable templates:

1. **Build** a common workflow
2. **Save** as template
3. **Reuse** for similar plugins
4. **Customize** as needed

### Integration

- **Webhooks**: Connect to external services
- **APIs**: Integrate with third-party APIs
- **Databases**: Store complex data
- **Scheduling**: Time-based triggers
