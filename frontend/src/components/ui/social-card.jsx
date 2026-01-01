import { cn } from "@/lib/utils";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Link2, Flag, Archive, Trash2, Copy, Check, UserPlus, UserMinus, Edit3 } from "lucide-react";

export function SocialCard({
  id,
  author,
  content,
  engagement,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onMore,
  className,
  children,
  repostedBy, // New prop: { name, username }
  permissions // New prop: { isOwner, isFollowingAuthor, canFollow, canDelete, etc. }
}) {
  const [isLiked, setIsLiked] = useState(engagement?.isLiked ?? false);
  const [isBookmarked, setIsBookmarked] = useState(engagement?.isBookmarked ?? false);
  const [likes, setLikes] = useState(engagement?.likes ?? 0);
  const [copied, setCopied] = useState(false);

  // Sync state with props when data is re-fetched
  useEffect(() => {
    setIsLiked(engagement?.isLiked ?? false);
    setLikes(engagement?.likes ?? 0);
    setIsBookmarked(engagement?.isBookmarked ?? false);
  }, [engagement?.isLiked, engagement?.likes, engagement?.isBookmarked]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
    onLike?.();
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    onBookmark?.();
  };

  const handleCopyLink = () => {
    const postLink = `${window.location.origin}/post/${id || engagement?.id || author?.username}`;
    navigator.clipboard.writeText(postLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "w-full max-w-2xl mx-auto",
        "bg-white/10 dark:bg-black/20 backdrop-blur-md text-foreground",
        "border border-white/10 shadow-sm transition-all hover:bg-white/15 dark:hover:bg-black/25",
        "rounded-3xl",
        className
      )}
    >
      <div className="divide-y divide-border">
        <div className="p-6">
          {/* Repost Header */}
          {repostedBy && (
            <div className="flex items-center gap-2 mb-3 px-1 text-xs font-semibold text-muted-foreground">
              <Share2 className="w-3 h-3" />
              <span>{repostedBy.name} reposted</span>
            </div>
          )}

          {/* Author section */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img
                src={author?.avatar}
                alt={author?.name}
                className="w-10 h-10 rounded-full ring-2 ring-background focus:outline-none focus:ring-primary/20 transition-all hover:opacity-90"
              />
              <div>
                <h3 className="text-sm font-semibold text-foreground hover:underline cursor-pointer">
                  {author?.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  @{author?.username} · {author?.timeAgo}
                </p>
              </div>
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground outline-none"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-1.5" align="end">
                <div className="flex flex-col gap-0.5">
                  {/* General Actions */}
                  <button 
                    onClick={handleCopyLink}
                    className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors w-full text-left"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4 text-muted-foreground" />}
                    <span className="font-medium">{copied ? "Copied!" : "Copy link"}</span>
                  </button>

                  {/* Owner Actions */}
                  {permissions?.isOwner && (
                    <>
                      {permissions.canEdit && (
                        <button 
                          onClick={() => onMore("edit")}
                          className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors w-full text-left font-medium"
                        >
                          <Edit3 className="w-4 h-4 text-muted-foreground" />
                          <span>Edit post</span>
                        </button>
                      )}
                      <button 
                        onClick={() => onMore("archive")}
                        className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors w-full text-left font-medium"
                      >
                        <Archive className="w-4 h-4 text-muted-foreground" />
                        <span>Archive</span>
                      </button>
                      
                      {permissions.canDelete && (
                        <>
                          <div className="h-px bg-border my-1" />
                          <button 
                            onClick={() => onMore("delete")}
                            className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive rounded-lg transition-colors w-full text-left font-bold"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete post</span>
                          </button>
                        </>
                      )}
                    </>
                  )}

                  {/* Other User Actions */}
                  {!permissions?.isOwner && permissions && (
                    <>
                      {permissions.canFollow && (
                        <button 
                          onClick={() => onMore("follow")}
                          className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors w-full text-left font-medium"
                        >
                          <UserPlus className="w-4 h-4 text-primary" />
                          <span>{permissions.followStatus === 'PENDING' ? "Requested" : `Follow @${author?.username}`}</span>
                        </button>
                      )}
                      {permissions.isFollowing && (
                         <button 
                          onClick={() => onMore("unfollow")}
                          className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors w-full text-left font-medium"
                         >
                           <UserMinus className="w-4 h-4 text-muted-foreground" />
                           <span>Unfollow @{author?.username}</span>
                         </button>
                      )}
                      
                      {permissions.canReport && (
                        <>
                          <div className="h-px bg-border my-1" />
                          <button 
                            onClick={() => {
                              if (window.confirm("Are you sure you want to report this post? Our team will review it.")) {
                                onMore("report");
                              }
                            }}
                            className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive rounded-lg transition-colors w-full text-left font-medium"
                          >
                            <Flag className="w-4 h-4" />
                            <span>Report post</span>
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Content section */}
          <p className="text-foreground mb-4 whitespace-pre-wrap">
            {content?.text}
          </p>

          {/* Media Attachments */}
          {content?.media && content.media.length > 0 && (
            <div className={cn(
              "grid gap-2 mb-4 rounded-2xl overflow-hidden cursor-pointer",
              content.media.length === 1 ? "grid-cols-1" : "grid-cols-2"
            )}>
              {content.media.map((item, index) => (
                <div key={index} className="relative aspect-video bg-muted">
                  {item.type === 'video' ? (
                     <video 
                       src={item.url} 
                       controls 
                       className="w-full h-full object-cover"
                     /> 
                  ) : (
                    <img 
                      src={item.url} 
                      alt="Post attachment" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Link preview */}
          {content?.link && (
            <div className="mb-4 rounded-2xl border bg-muted/50 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-background rounded-xl">
                    {content.link.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">
                      {content.link.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {content.link.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Engagement section */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={handleLike}
                className={cn(
                  "flex items-center gap-2 text-sm transition-colors",
                  isLiked
                    ? "text-rose-600"
                    : "text-muted-foreground hover:text-rose-600"
                )}
              >
                <Heart
                  className={cn(
                    "w-5 h-5 transition-all",
                    isLiked && "fill-current scale-110"
                  )}
                />
                <span>{likes}</span>
              </button>
              <button
                type="button"
                onClick={onComment}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span>{engagement?.comments}</span>
              </button>
              <button
                type="button"
                onClick={onShare}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-green-500 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                <span>{engagement?.shares}</span>
              </button>
            </div>
            <button
              type="button"
              onClick={handleBookmark}
              className={cn(
                "p-2 rounded-full transition-all",
                isBookmarked 
                  ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10" 
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Bookmark className={cn(
                "w-5 h-5 transition-transform",
                isBookmarked && "fill-current scale-110"
              )} />
            </button>
          </div>

          {/* Optional Children (Comments) */}
          {children && (
             children
          )}
        </div>
      </div>
    </div>
  );
}
