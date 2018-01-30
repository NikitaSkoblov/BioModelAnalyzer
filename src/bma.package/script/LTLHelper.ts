// Copyright (c) Microsoft Research 2016
// License: MIT. See LICENSE
module BMA {
    export module LTLOperations {

        export function GetKeyframeImagePath(keyframetype: string, root: string) {
            switch (keyframetype) {
                case "oscillationkeyframe":
                    return root + "/images/oscillation-state.svg";
                case "truekeyframe":
                    return root + "/images/true-state.svg";
                case "selfloopkeyframe":
                    return root + "/images/selfloop-state.svg";
                default:
                    throw "Unknown keyframe type";
            }
        }

        export function RoundRect(ctx, x, y, w, h, r) {
            if (w < 2 * r) r = w / 2;
            if (h < 2 * r) r = h / 2;
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
        }

        export function RenderOperation(canvas: HTMLCanvasElement, operation: IOperand, position: { x: number; y: number }, scale: { x: number; y: number }, operationAppearance: any): { width: number; height: number } {
            var context = canvas.getContext("2d");

            var layout = CreateLayout(operation, (name, fontSize) => {
                context.font = fontSize + "px OpenSans";
                return context.measureText(name).width;
            }, operationAppearance.padding, operationAppearance.keyFrameSize, { fontSize: 16 });

            var renderLayoutPart = (layoutPart, pos, options) => {
                var paddingX = operationAppearance.padding.x;
                var paddingY = operationAppearance.padding.y;

                if (layoutPart.isEmpty) {
                    context.strokeStyle = "rgb(96,96,96)";
                    context.fillStyle = "rgb(96,96,96)";
                    context.beginPath();
                    context.arc(pos.x, pos.y, operationAppearance.keyFrameSize / 2, 0, 2 * Math.PI, false);
                    context.closePath();
                    context.stroke();
                    context.fill();
                } else {
                    var operator = layoutPart.operator;
                    var halfWidth = layoutPart.width / 2;
                    var height = operationAppearance.keyFrameSize + paddingY * layoutPart.layer;

                    if (operator !== undefined) {
                        var operation = layoutPart;

                        
                        var fill = options && options.fill ? options.fill : "transparent";
                        var stroke = options && options.stroke ? options.stroke : "rgb(96,96,96)";

                        /*
                        var strokeWidth = 1;
                        if (options !== undefined) {
                            if (options.isRoot) {
                                strokeWidth = operationAppearance.borderThickness;
                            } else if (options.strokeWidth) {
                                strokeWidth = options.strokeWidth;
                            }
                        }
                        */

                        context.strokeStyle = "rgb(96,96,96)";
                        context.fillStyle = options !== undefined && options.isRoot && operationAppearance.fill !== undefined ? operationAppearance.fill : "transparent";
                        RoundRect(context, pos.x - halfWidth, pos.y - height / 2, halfWidth * 2, height, height / 2);
                        context.fill();
                        context.stroke();

                        var operands = operation.operands;

                        var offset = pos.x - halfWidth + paddingX;
                        if (layoutPart.isFunction || operands.length === 1) {
                            context.font = "10px OpenSans";
                            context.fillStyle = "rgb(96,96,96)";
                            context.fillText(operation.operator, offset, pos.y);
                            offset += layoutPart.operatorWidth + paddingX;
                        }
                        for (var i = 0; i < operands.length; i++) {
                            offset += operands[i].width / 2;
                            renderLayoutPart(operands[i], {
                                x: offset,
                                y: pos.y
                            }, undefined);

                            offset += operands[i].width / 2 + paddingX;
                            if (!layoutPart.isFunction) {
                                if (i < operands.length - 1) {
                                    context.font = "10px OpenSans";
                                    context.fillStyle = "rgb(96,96,96)";
                                    context.fillText(operation.operator, offset, pos.y);
                                }
                                offset += layoutPart.operatorWidth + paddingX;
                            }
                        }

                    } else {
                        var hks = operationAppearance.keyFrameSize / 2;

                        context.strokeStyle = "rgb(96,96,96)";
                        context.fillStyle = "rgb(238,238,238)";
                        RoundRect(context, pos.x - halfWidth, pos.y - height / 2, halfWidth * 2, height, hks);
                        //context.beginPath();
                        //context.arc(pos.x, pos.y, hks, 0, 2 * Math.PI, false);
                        //context.closePath();
                        context.fill();
                        context.stroke();

                        if (layoutPart.type === "keyframe" || layoutPart.type === "constant" || layoutPart.type === "other") {
                            var name = layoutPart.name;
                            var fs = 16;
                            context.font = "16px OpenSans";

                            var width = context.measureText(name).width;
                            //if (width > hks) {
                            //    fs = fs * hks / width;
                            //    width = hks;
                            //    context.font = fs + "px OpenSans";
                            //}
                            context.fillStyle = "rgb(96,96,96)";
                            context.fillText(name, pos.x - width / 2, pos.y);
                            //context.fill();
                        } else {
                            var img = new Image();
                            img.src = GetKeyframeImagePath(layoutPart.type, "..");

                            img.onload = () => {
                                context.save();
                                context.transform(scale.x, 0, 0, scale.y, position.x, position.y);
                                context.drawImage(img, pos.x - hks, pos.y - hks, hks * 2, hks * 2);
                                context.restore();
                            }
                        }
                    }
                }

            };

            context.save();
            context.transform(scale.x, 0, 0, scale.y, position.x, position.y);
            context.textBaseline = "middle";
            renderLayoutPart(layout, { x: 0, y: 0 }, operationAppearance);
            context.restore();

            return { width: layout.width, height: operationAppearance.keyFrameSize + operationAppearance.padding.y * layout.layer };
        }

        export function CalcOperationSize(operation: IOperand, getOperatorWidth: Function, padding: { x: number; y: number }, keyFrameSize: number): { width: number; height: number } {
            var layout = CreateLayout(operation, getOperatorWidth, padding, keyFrameSize, { fontSize: 16 });
            return { width: layout.width, height: keyFrameSize + padding.y * layout.layer };
        }

        export function CalcOperationSizeOnCanvas(canvas: HTMLCanvasElement, operation: IOperand, padding: { x: number; y: number }, keyFrameSize: number): { width: number; height: number } {
            var context = canvas.getContext("2d");
            var getOpWidth = (name, fontSize) => {
                context.font = fontSize + "px OpenSans";
                return context.measureText(name).width;
            };

            return CalcOperationSize(operation, getOpWidth, padding, keyFrameSize);
        }

        export function CreateLayout(operation: IOperand, getOperatorWidth: Function, padding: { x: number; y: number }, keyFrameSize: number, options: any = undefined): any {
            var layout: any = {};
            layout.operation = operation;

            var paddingX = padding.x;
            var fontSize = 10;
            if (options !== undefined && options.fontSize !== undefined) {
                fontSize = options.fontSize;
            }

            var op = operation;
            var operator = (<any>op).Operator;
            if (operator !== undefined) {
                layout.operands = [];
                layout.operator = operator.Name;
                layout.isFunction = operator.isFunction;

                var operands = (<BMA.LTLOperations.Operation>op).Operands;
                var layer = 0;
                var operatorWidth = getOperatorWidth(operator.Name, 10);
                var width = paddingX;
                if (operator.isFunction || operands.length === 1) {
                    width += operatorWidth + paddingX;
                }

                layout.operatorWidth = operatorWidth;


                for (var i = 0; i < operands.length; i++) {
                    var operand = operands[i];

                    if (operand !== undefined) {
                        var calcLW = CreateLayout(operand, getOperatorWidth, padding, keyFrameSize, options);
                        calcLW.parentoperationindex = i;
                        calcLW.parentoperation = operation;
                        layer = Math.max(layer, calcLW.layer);
                        layout.operands.push(calcLW);
                        width += (calcLW.width + paddingX);
                    } else {
                        layout.operands.push({ isEmpty: true, width: keyFrameSize, operationRef: op, indexRef: i, isFlex: true });
                        width += (keyFrameSize + paddingX);
                    }

                    if (!operator.isFunction && i > 0) {
                        width += operatorWidth + paddingX;
                    }
                }

                //Adding empty slot for operators with flexible operands count
                if (options !== undefined && options.viewmode === "compact") {
                    if (!isFinite(operator.MaxOperandsCount)) {
                        layout.operands[layout.operands.length - 1].isFlexible = true;
                    }
                }

                
                if (options !== undefined && options.viewmode === "extended") {
                    if (!isFinite(operator.MaxOperandsCount) && operands[operands.length - 1] !== undefined) {
                        layout.operands.push({ isEmpty: true, width: keyFrameSize, operationRef: op, indexRef: operands.length });
                        width += (keyFrameSize + paddingX);
                        if (!operator.isFunction) {
                            width += operatorWidth + paddingX;
                        }
                    }
                }

                layout.layer = layer + 1;
                layout.width = width;
                return layout;
            } else {
                var w = keyFrameSize;
                layout.layer = 0;
                layout.width = w;

                if (operation instanceof TrueKeyframe) {
                    layout.type = "truekeyframe";
                } else if (operation instanceof OscillationKeyframe) {
                    layout.type = "oscillationkeyframe";
                } else if (operation instanceof SelfLoopKeyframe) {
                    layout.type = "selfloopkeyframe";
                } else if (operation instanceof Keyframe) {
                    layout.type = "keyframe";
                    layout.name = (<Keyframe>operation).Name;
                    layout.width = Math.max(w, getOperatorWidth(layout.name, fontSize) + 2 * paddingX);
                } else if (operation instanceof ConstOperand) {
                    layout.type = "constant";
                    layout.name = (<ConstOperand>operation).Value + "";
                    layout.width = Math.max(w, getOperatorWidth(layout.name, fontSize) + 2 * paddingX);
                } else{
                    layout.type = "other";
                    layout.name = (<Keyframe>operation).Name;
                    layout.width = Math.max(w, getOperatorWidth(layout.name, fontSize) + 2 * paddingX);
                }

                return layout;
            }
        }

        export function GetLTLServiceProcessingFormula(operation: BMA.LTLOperations.IOperand): string {
            if (operation instanceof NameOperand) {
                return (<NameOperand>operation).Id;
            } else if (operation instanceof ConstOperand) {
                return (<ConstOperand>operation).Value.toString();
            } else if (operation instanceof KeyframeEquation) {
                var equation = <KeyframeEquation>operation;
                return "(" + equation.Operator + " " + GetLTLServiceProcessingFormula(equation.LeftOperand) + " " + GetLTLServiceProcessingFormula(equation.RightOperand) + ")";
            } else if (operation instanceof TrueKeyframe) {
                return "True";
            } else if (operation instanceof OscillationKeyframe) {
                return "Oscillation";
            } else if (operation instanceof SelfLoopKeyframe) {
                return "SelfLoop";
            } else if (operation instanceof Keyframe) {
                var operands = (<Keyframe>operation).Operands;
                if (operands === undefined || operands.length < 1) {
                    return "";
                } else {
                    if (operands.length === 1)
                        return GetLTLServiceProcessingFormula(operands[0]);

                    var formula = GetLTLServiceProcessingFormula(operands[operands.length - 1]);

                    for (var i = operands.length - 2; i >= 0; i--) {
                        formula = "(And " + GetLTLServiceProcessingFormula(operands[i]) + " " + formula + ")";
                    }

                    return formula;
                }
            } else if (operation instanceof Operation) {
                var op = <Operation>operation;
                var operator = op.Operator;
                var result = "(" + operator.Name[0] + operator.Name.substring(1).toLowerCase();
                for (var i = 0; i < op.Operands.length; i++) {
                    result += " " + GetLTLServiceProcessingFormula(op.Operands[i]);
                }
                result += ")";
                return result;
            }

            throw "Unknown operand type!";
        }
    }
}
