def get_puzzle_data():
    """
    Returns the Christmas crossword puzzle data structure.
    This includes the grid layout, clues, and answers.
    """
    return {
        "title": "Seemoto Christmas Crossword 2024",
        "grid_size": {"rows": 15, "cols": 15},
        "across_clues": [
            {
                "number": 1,
                "clue": "Santa's helpers",
                "answer": "ELVES",
                "row": 0,
                "col": 0
            }
            # More clues will be added here
        ],
        "down_clues": [
            {
                "number": 1,
                "clue": "December 24th",
                "answer": "EVE",
                "row": 0,
                "col": 0
            }
            # More clues will be added here
        ]
    }
