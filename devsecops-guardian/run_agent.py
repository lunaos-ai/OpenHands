#!/usr/bin/env python3
import asyncio
import os
import sys

# Add project root to Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Add agent src to path for direct import
agent_src = os.path.join(os.path.dirname(__file__), 'src')
sys.path.insert(0, agent_src)

# Import the agent to ensure registration
from security_agent.security_agent import SecurityAgent

# Import OpenHands core modules
from openhands.core.main import run_controller, auto_continue_response
from openhands.core.config import parse_arguments, setup_config_from_args
from openhands.io import read_task
from openhands.events.action import MessageAction, NullAction
from openhands.core.setup import generate_sid
from openhands.events.action import Action

if __name__ == '__main__':
    # Parse arguments
    args = parse_arguments()

    # Set default agent if not provided
    if not args.agent_cls:
        args.agent_cls = 'SecurityAgent'

    config = setup_config_from_args(args)

    # Read task
    task_str = read_task(args, config.cli_multiline_input)

    initial_user_action: Action = NullAction()
    if config.replay_trajectory_path:
        if task_str:
            raise ValueError(
                'User-specified task is not supported under trajectory replay mode'
            )
    else:
        if not task_str:
            raise ValueError('No task provided. Please specify a task through -t, -f.')
        initial_user_action = MessageAction(content=task_str)

    session_name = args.name
    sid = generate_sid(config, session_name)

    asyncio.run(
        run_controller(
            config=config,
            initial_user_action=initial_user_action,
            sid=sid,
            fake_user_response_fn=None
            if args.no_auto_continue
            else auto_continue_response,
        )
    )
