import {GRID_WIDTH} from "../../common/grid";
import {getPiece, PIECES_MOVE, PIECES_NUM} from "../../common/pieces";
import {clonePiece} from "./clone-handler"
import {logger} from "./logger-handler"

const COLLISION_TYPE = {
  PIECE: "collision_piece",
  WALL_RIGHT: "collision_wall_right",
  WALL_LEFT: "collision_wall_left",
  WALL_BOTTOM: "collision_wall_bottom",
  WALL_TOP: "collision_top",
};

const PRIO_COLLISION = [
  COLLISION_TYPE.WALL_TOP,
  COLLISION_TYPE.PIECE,
  COLLISION_TYPE.WALL_BOTTOM,
  COLLISION_TYPE.WALL_RIGHT,
  COLLISION_TYPE.WALL_LEFT
];

const hasCollision = (grid, piece, loc) => {
  let collisionType = undefined;
  piece.forEach((line, y) => line.forEach((number, x) => {
    const gx = x + loc.x;
    const gy = y + loc.y;

    if (gy < 0 && number !== 0) {
      if (PRIO_COLLISION.indexOf(collisionType) < PRIO_COLLISION.indexOf(COLLISION_TYPE.WALL_TOP)) {
        collisionType = COLLISION_TYPE.WALL_TOP;
      }
    }
    else if (gy >= grid.length && number !== 0) {
      if (PRIO_COLLISION.indexOf(collisionType) < PRIO_COLLISION.indexOf(COLLISION_TYPE.WALL_BOTTOM)) {
        collisionType = COLLISION_TYPE.WALL_BOTTOM;
      }
    }
    else if (gx < 0 && number !== 0) {
      if (PRIO_COLLISION.indexOf(collisionType) < PRIO_COLLISION.indexOf(COLLISION_TYPE.WALL_LEFT)) {
        collisionType = COLLISION_TYPE.WALL_LEFT;
      }
    }
    else if (gx >= GRID_WIDTH && number !== 0) {
      if (PRIO_COLLISION.indexOf(collisionType) < PRIO_COLLISION.indexOf(COLLISION_TYPE.WALL_RIGHT)) {
        collisionType = COLLISION_TYPE.WALL_RIGHT;
      }
    }
    else if (number !== 0 && grid[gy][gx] !== 0) {
      if (PRIO_COLLISION.indexOf(collisionType) < PRIO_COLLISION.indexOf(COLLISION_TYPE.PIECE)) {
        collisionType = COLLISION_TYPE.PIECE;
      }
    }
  }));
  return collisionType;
};

const placePiece = (grid, piece) => {
  const newGrid = grid.map(l => l.map(e => e));
  const pieceDescr = getPiece(piece.num, piece.rot);
  pieceDescr.forEach((line, y) => {
      return line.forEach((number, x) => {
          const gx = x + piece.pos.x;
          const gy = y + piece.pos.y;
          if (number !== 0) {
            if (gx >= 0 && gy >= 0 &&
              gy < newGrid.length && gx < newGrid[gy].length) {
              newGrid[gy][gx] = number;
            } else {
              logger(["invalide placement:", grid, piece]);
            }
          }
        }
      )
    }
  );
  return newGrid;
};

const placePiecePreview = (grid, piece) => {
  const newGrid = grid.map(l => l.map(e => e));
  const pieceDescr = getPiece(piece.num, piece.rot);
  const loc = newLoc(piece.pos);

  while (!hasCollision(grid, pieceDescr, loc)) {
    loc.y++;
  }
  if (loc.y > 0) {
    loc.y--;
  }

  pieceDescr.forEach((line, y) =>
    line.forEach((number, x) => {
        const gx = x + loc.x;
        const gy = y + loc.y;
        if (number !== 0) {
          if (gx >= 0 && gy >= 0 &&
            gy < newGrid.length && gx < newGrid[gy].length) {
            newGrid[gy][gx] = PIECES_NUM.preview;
          } else {
            logger(["invalide placement:", grid, piece]);
          }
        }
      }
    )
  );
  return newGrid;
};

const newLoc = (loc, move) => {
  if (move === PIECES_MOVE.DOWN)
    return {x: loc.x, y: loc.y + 1};
  else if (move === PIECES_MOVE.LEFT)
    return {x: loc.x - 1, y: loc.y};
  else if (move === PIECES_MOVE.RIGHT)
    return {x: loc.x + 1, y: loc.y};
  return {x: loc.x, y: loc.y};
};

const newRot = (rot, move) => {
  if (move === PIECES_MOVE.ROT_RIGHT) {
    return (rot + 1) % 4;
  }
  if (move === PIECES_MOVE.ROT_LEFT) {
    return (rot + 3) % 4;
  }
  return rot;
};

const updatePieceSwitch = (grid, Flow) => {
  const newFlow = Flow.map(p => clonePiece(p));

  let tmp1 = clonePiece(Flow[0]);
  let tmp2 = clonePiece(Flow[1]);
  tmp1.pos = Flow[1].pos;
  tmp2.pos = Flow[0].pos;
  tmp1 = moveCollision(tmp1, grid);
  tmp2 = moveCollision(tmp2, grid);

  newFlow[0] = tmp2;
  newFlow[1] = tmp1;
  return [false, newFlow];
};

const updatePieceRot = (grid, Flow, move) => {
  const newFlow = Flow.map(p => clonePiece(p));

  const newPiece = {
    num: Flow[0].num,
    rot: newRot(Flow[0].rot, move),
    pos: newLoc(Flow[0].pos, move)
  };

  newFlow[0] = moveCollision(newPiece, grid);
  return [false, newFlow];
};

const moveCollision = (piece, grid) => {

  const newPiece = clonePiece(piece);
  const newPieceDescr = getPiece(newPiece.num, newPiece.rot);

  let collisionType = hasCollision(grid, newPieceDescr, newPiece.pos);

  while (collisionType && collisionType !== COLLISION_TYPE.WALL_TOP) {
    if (collisionType === COLLISION_TYPE.WALL_LEFT) {
      newPiece.pos.x++;
    } else if (collisionType === COLLISION_TYPE.WALL_RIGHT) {
      newPiece.pos.x--;
    } else {
      newPiece.pos.y--;
    }
    collisionType = hasCollision(grid, newPieceDescr, newPiece.pos);
  }
  return newPiece;
};

const updatePiecePos = (grid, Flow, move) => {
  const newFlow = Flow.map(p => clonePiece(p));

  if (move === PIECES_MOVE.ROT_LEFT || move === PIECES_MOVE.ROT_RIGHT) {
    return updatePieceRot(grid, Flow, move);
  } else if (move === PIECES_MOVE.DROP) {
    const newPiece = clonePiece(Flow[0]);
    const newPieceDescr = getPiece(newPiece.num, newPiece.rot);
    while (!hasCollision(grid, newPieceDescr, newPiece.pos)) {
      newPiece.pos.y++;
    }
    newPiece.pos.y--;
    newFlow[0] = newPiece;
    return [true, newFlow];
  } else if (move === PIECES_MOVE.RIGHT || move === PIECES_MOVE.LEFT) {
    const newPiece = {
      num: Flow[0].num,
      rot: newRot(Flow[0].rot, move),
      pos: newLoc(Flow[0].pos, move)
    };
    const newPieceDescr = getPiece(newPiece.num, newPiece.rot);
    if (!hasCollision(grid, newPieceDescr, newPiece.pos)) {
      newFlow[0] = newPiece;
    }
    return [false, newFlow];
  } else if (move === PIECES_MOVE.DOWN) {
    const newPiece = {
      num: Flow[0].num,
      rot: newRot(Flow[0].rot, move),
      pos: newLoc(Flow[0].pos, move)
    };
    const newPieceDescr = getPiece(newPiece.num, newPiece.rot);
    if (!hasCollision(grid, newPieceDescr, newPiece.pos)) {
      newFlow[0] = newPiece;
      return [false, newFlow];
    }
    return [true, newFlow];
  }
  return updatePieceSwitch(grid, Flow);
};

const gridDelLine = grid => {

  let nbWall = 0;
  let lineToDel = [];
  let newGrid = grid.map(l => l.map(e => e));

  newGrid.forEach((line, i) => {
    let asEmpty = false;
    let asWall = false;
    line.forEach(el => {
      if (el === PIECES_NUM.empty) {
        asEmpty = true;
      }
      if (el === PIECES_NUM.wall_malus) {
        asWall = true;
      }
    });
    if (!asEmpty) {
      lineToDel.push(i);
      if (asWall) {
        nbWall++;
      }
    }
  });

  newGrid = newGrid.filter((line, i) => !lineToDel.includes(i));
  while (newGrid.length < grid.length) {
    newGrid = [Array(GRID_WIDTH).fill(PIECES_NUM.empty), ...newGrid];
  }

  return [newGrid, lineToDel.length - nbWall];
};

const gridAddWall = (grid, amount) => {
  const pos_x = Math.floor(Math.random() * GRID_WIDTH);
  const newGrid = grid.map(l => l.map(e => e));

  for (let i = 0; i < amount; i++) {
    newGrid.push(Array(GRID_WIDTH).fill(PIECES_NUM.wall_malus));
    newGrid.shift();
    newGrid[newGrid.length - 1][pos_x] = PIECES_NUM.empty;
  }

  return newGrid;
};


export {
  hasCollision,
  placePiece,
  COLLISION_TYPE,
  newLoc,
  updatePiecePos,
  gridDelLine,
  gridAddWall,
  placePiecePreview,
  newRot,
}
